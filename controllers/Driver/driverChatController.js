const ChatMessage = require('../../models/Chatmessage');
const Driver = require('../../models/Driver');

// Helper to generate conversation ID
const generateConversationId = (userId1, userId2) => {
  const ids = [userId1.toString(), userId2.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

// Get Driver's Conversations (with Admin)
exports.getDriverConversations = async (req, res) => {
  try {
    const driverId = req.driver._id;

    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { senderId: driverId, senderType: 'Driver' },
            { receiverId: driverId, receiverType: 'Driver' }
          ]
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', driverId] }, { $eq: ['$isRead', false] }] },
                1, 0
              ]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Only one participant: Admin
    for (let conv of conversations) {
      conv.participant = {
        id: 'admin',
        name: 'Admin Support',
        type: 'admin',
        profileImage: '/images/admin-avatar.png'
      };
    }

    return res.status(200).json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Driver Get Conversations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load chats' });
  }
};

// Get Messages in Conversation
exports.getDriverMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const driverId = req.driver._id;

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name profileImage')
      .lean();

    // Mark as read
    await ChatMessage.updateMany(
      { conversationId, receiverId: driverId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return res.status(200).json({
      success: true,
      data: { messages }
    });

  } catch (error) {
    console.error('Driver Get Messages Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
};

// Send Message from Driver to Admin
exports.sendMessageFromDriver = async (req, res) => {
  try {
    const driver = req.driver;
    const { content, messageType = 'text', mediaUrl, location } = req.body;

    const conversationId = generateConversationId(driver._id, 'admin');

    const message = await ChatMessage.create({
      conversationId,
      senderId: driver._id,
      senderType: 'Driver',
      receiverId: null, 
      receiverType: 'Admin',
      messageType,
      content,
      mediaUrl,
      location,
      isDelivered: true,
      deliveredAt: new Date()
    });

    await message.populate('senderId', 'name profileImage vehicleNumber');

    // Emit to Admin Panel
    if (global.io) {
      global.io.to('admin-room').emit('chat:new-message', {
        conversationId,
        message: {
          ...message.toObject(),
          senderId: {
            _id: driver._id,
            name: driver.name || driver.phone,
            profileImage: driver.profileImage,
            vehicleNumber: driver.vehicleNumber
          }
        }
      });

      // Also emit to conversation room
      global.io.to(`conversation-${conversationId}`).emit('chat:new-message', {
        conversationId,
        message
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent to admin',
      data: { message }
    });

  } catch (error) {
    console.error('Driver Send Message Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to send message' });
  }
};

module.exports = exports;