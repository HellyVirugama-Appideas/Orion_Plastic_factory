const ChatMessage = require('../../models/Chatmessage');
const Driver = require('../../models/Driver');
const Delivery = require('../../models/Delivery');

// ==================== ADMIN CHAT CONTROLLER ====================

// Get all conversations
exports.getConversations = async (req, res) => {
  try {
    const adminId = req.user._id;

    // Get unique conversations
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: adminId },
            { receiverId: adminId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [
                  { $eq: ['$receiverId', adminId] },
                  { $eq: ['$isRead', false] }
                ]},
                1,
                0
              ]
            }
          }
        }
      },
      {
        $sort: { 'lastMessage.createdAt': -1 }
      }
    ]);

    // Populate driver/customer details
    for (let conv of conversations) {
      const otherUserId = conv.lastMessage.senderId.toString() === adminId.toString() 
        ? conv.lastMessage.receiverId 
        : conv.lastMessage.senderId;
      
      const otherUserType = conv.lastMessage.senderId.toString() === adminId.toString()
        ? conv.lastMessage.receiverType
        : conv.lastMessage.senderType;

      if (otherUserType === 'Driver') {
        const driver = await Driver.findById(otherUserId)
          .populate('userId', 'name phone profileImage');
        conv.participant = {
          id: driver._id,
          name: driver.userId.name,
          phone: driver.userId.phone,
          profileImage: driver.userId.profileImage,
          type: 'driver',
          vehicleNumber: driver.vehicleNumber
        };
      }
      // Add Customer lookup if needed
    }

    return res.status(200).json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Get Conversations Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get conversations'
    });
  }
};

// Get messages in a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .populate('senderId', 'name phone profileImage')
      .populate('receiverId', 'name phone profileImage');

    const total = await ChatMessage.countDocuments({ conversationId });

    // Mark messages as read
    await ChatMessage.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    return res.status(200).json({
      success: true,
      data: {
        messages: messages.reverse(),
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Get Messages Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get messages'
    });
  }
};

// Send message
exports.sendMessage = async (req, res) => {
  try {
    const {
      receiverId,
      receiverType,
      messageType,
      content,
      mediaUrl,
      location,
      deliveryId
    } = req.body;

    const adminId = req.user._id;
    const conversationId = generateConversationId(adminId, receiverId);

    const message = await ChatMessage.create({
      conversationId,
      senderId: adminId,
      senderType: 'Admin',
      receiverId,
      receiverType,
      messageType: messageType || 'text',
      content,
      mediaUrl,
      location,
      deliveryId,
      isDelivered: true,
      deliveredAt: new Date()
    });

    // Populate sender details
    await message.populate('senderId', 'name profileImage');

    // Emit via Socket.IO
    if (global.io) {
      global.io.to(`user-${receiverId}`).emit('chat:new-message', {
        conversationId,
        message
      });
    }

    // Send push notification
    const NotificationService = require('../../services/NotificationService');
    await NotificationService.sendNotification({
      recipientId: receiverId,
      recipientType: receiverType,
      type: 'new_message',
      title: 'New Message from Admin',
      message: content.substring(0, 100),
      data: {
        chatMessageId: message._id,
        conversationId
      },
      channels: ['push']
    });

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message }
    });

  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await ChatMessage.updateMany(
      {
        conversationId,
        receiverId: req.user._id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    // Notify sender via Socket.IO
    if (global.io) {
      global.io.to(`conversation-${conversationId}`).emit('chat:messages-read', {
        conversationId,
        readBy: req.user._id,
        readAt: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('Mark As Read Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read'
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      receiverId: req.user._id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      data: { unreadCount }
    });

  } catch (error) {
    console.error('Get Unread Count Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count'
    });
  }
};

// Delete message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    await message.deleteOne();

    // Emit via Socket.IO
    if (global.io) {
      global.io.to(`conversation-${message.conversationId}`).emit('chat:message-deleted', {
        messageId,
        conversationId: message.conversationId
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete Message Error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
};

// Helper function
function generateConversationId(userId1, userId2) {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
}

module.exports = exports;