// const ChatMessage = require('../../models/Chatmessage');
// const Driver = require('../../models/Driver');
// const Delivery = require('../../models/Delivery');

// // ==================== ADMIN CHAT CONTROLLER ====================
 
// // Get all conversations
// exports.getConversations = async (req, res) => {
//   try {
//     const adminId = req.user._id;

//     // Get unique conversations
//     const conversations = await ChatMessage.aggregate([
//       {
//         $match: {
//           $or: [
//             { senderId: adminId },
//             { receiverId: adminId }
//           ]
//         }
//       },
//       {
//         $sort: { createdAt: -1 }
//       },
//       {
//         $group: {
//           _id: '$conversationId',
//           lastMessage: { $first: '$$ROOT' },
//           unreadCount: {
//             $sum: {
//               $cond: [
//                 { $and: [
//                   { $eq: ['$receiverId', adminId] },
//                   { $eq: ['$isRead', false] }
//                 ]},
//                 1,
//                 0
//               ]
//             }
//           }
//         }
//       },
//       {
//         $sort: { 'lastMessage.createdAt': -1 }
//       }
//     ]);

//     // Populate driver/customer details
//     for (let conv of conversations) {
//       const otherUserId = conv.lastMessage.senderId.toString() === adminId.toString() 
//         ? conv.lastMessage.receiverId 
//         : conv.lastMessage.senderId;
      
//       const otherUserType = conv.lastMessage.senderId.toString() === adminId.toString()
//         ? conv.lastMessage.receiverType
//         : conv.lastMessage.senderType;

//       if (otherUserType === 'Driver') {
//         const driver = await Driver.findById(otherUserId)
//           .populate('userId', 'name phone profileImage');
//         conv.participant = {
//           id: driver._id,
//           name: driver.userId.name,
//           phone: driver.userId.phone,
//           profileImage: driver.userId.profileImage,
//           type: 'driver',
//           vehicleNumber: driver.vehicleNumber
//         };
//       }
//       // Add Customer lookup if needed
//     }

//     return res.status(200).json({
//       success: true,
//       data: { conversations }
//     });

//   } catch (error) {
//     console.error('Get Conversations Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to get conversations'
//     });
//   }
// };

// // Get messages in a conversation
// exports.getMessages = async (req, res) => {
//   try {
//     const { conversationId } = req.params;
//     const { page = 1, limit = 50 } = req.query;

//     const messages = await ChatMessage.find({ conversationId })
//       .sort({ createdAt: -1 })
//       .limit(parseInt(limit))
//       .skip((parseInt(page) - 1) * parseInt(limit))
//       .populate('senderId', 'name phone profileImage')
//       .populate('receiverId', 'name phone profileImage');

//     const total = await ChatMessage.countDocuments({ conversationId });

//     // Mark messages as read
//     await ChatMessage.updateMany(
//       {
//         conversationId,
//         receiverId: req.user._id,
//         isRead: false
//       },
//       {
//         isRead: true,
//         readAt: new Date()
//       }
//     );

//     return res.status(200).json({
//       success: true,
//       data: {
//         messages: messages.reverse(),
//         pagination: {
//           total,
//           page: parseInt(page),
//           pages: Math.ceil(total / parseInt(limit)),
//           limit: parseInt(limit)
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get Messages Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to get messages'
//     });
//   }
// };

// // Send message
// exports.sendMessage = async (req, res) => {
//   try {
//     const {
//       receiverId,
//       receiverType,
//       messageType,
//       content,
//       mediaUrl,
//       location,
//       deliveryId
//     } = req.body;

//     const adminId = req.user._id;
//     const conversationId = generateConversationId(adminId, receiverId);

//     const message = await ChatMessage.create({
//       conversationId,
//       senderId: adminId,
//       senderType: 'Admin',
//       receiverId,
//       receiverType,
//       messageType: messageType || 'text',
//       content,
//       mediaUrl,
//       location,
//       deliveryId,
//       isDelivered: true,
//       deliveredAt: new Date()
//     });

//     // Populate sender details
//     await message.populate('senderId', 'name profileImage');

//     // Emit via Socket.IO
//     if (global.io) {
//       global.io.to(`user-${receiverId}`).emit('chat:new-message', {
//         conversationId,
//         message
//       });
//     }

//     // Send push notification
//     const NotificationService = require('../../services/NotificationService');
//     await NotificationService.sendNotification({
//       recipientId: receiverId,
//       recipientType: receiverType,
//       type: 'new_message',
//       title: 'New Message from Admin',
//       message: content.substring(0, 100),
//       data: {
//         chatMessageId: message._id,
//         conversationId
//       },
//       channels: ['push']
//     });

//     return res.status(201).json({
//       success: true,
//       message: 'Message sent successfully',
//       data: { message }
//     });

//   } catch (error) {
//     console.error('Send Message Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to send message'
//     });
//   }
// };

// // Mark messages as read
// exports.markAsRead = async (req, res) => {
//   try {
//     const { conversationId } = req.params;

//     await ChatMessage.updateMany(
//       {
//         conversationId,
//         receiverId: req.user._id,
//         isRead: false
//       },
//       {
//         isRead: true,
//         readAt: new Date()
//       }
//     );

//     // Notify sender via Socket.IO
//     if (global.io) {
//       global.io.to(`conversation-${conversationId}`).emit('chat:messages-read', {
//         conversationId,
//         readBy: req.user._id,
//         readAt: new Date()
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Messages marked as read'
//     });

//   } catch (error) {
//     console.error('Mark As Read Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to mark messages as read'
//     });
//   }
// };

// // Get unread count
// exports.getUnreadCount = async (req, res) => {
//   try {
//     const unreadCount = await ChatMessage.countDocuments({
//       receiverId: req.user._id,
//       isRead: false
//     });

//     return res.status(200).json({
//       success: true,
//       data: { unreadCount }
//     });

//   } catch (error) {
//     console.error('Get Unread Count Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to get unread count'
//     });
//   }
// };

// // Delete message
// exports.deleteMessage = async (req, res) => {
//   try {
//     const { messageId } = req.params;

//     const message = await ChatMessage.findById(messageId);
//     if (!message) {
//       return res.status(404).json({
//         success: false,
//         message: 'Message not found'
//       });
//     }

//     // Only sender can delete
//     if (message.senderId.toString() !== req.user._id.toString()) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only delete your own messages'
//       });
//     }

//     await message.deleteOne();

//     // Emit via Socket.IO
//     if (global.io) {
//       global.io.to(`conversation-${message.conversationId}`).emit('chat:message-deleted', {
//         messageId,
//         conversationId: message.conversationId
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: 'Message deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete Message Error:', error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || 'Failed to delete message'
//     });
//   }
// };

// // Helper function
// function generateConversationId(userId1, userId2) {
//   const ids = [userId1.toString(), userId2.toString()].sort();
//   return `${ids[0]}_${ids[1]}`;
// }

// module.exports = exports;

// controllers/admin/ChatController.js  (capital C recommended)

const ChatMessage = require('../../models/Chatmessage');
const Driver = require('../../models/Driver');

// Helper
const generateConversationId = (adminId, driverId) => {
  const ids = [adminId.toString(), driverId.toString()].sort();
  return `${ids[0]}_${ids[1]}`;
};

// Get all conversations (already good – minor fix for driver populate)
exports.getConversations = async (req, res) => {
  try {
    const conversations = await ChatMessage.aggregate([
      { $match: { $or: [{ senderType: 'Admin' }, { receiverType: 'Admin' }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverType', 'Admin'] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    for (let conv of conversations) {
      const driverId = conv._id.split('_').find(id => id !== 'admin'); // assuming admin has no _id in DB
      if (driverId) {
        const driver = await Driver.findById(driverId).select('name phone vehicleNumber profileImage');
        if (driver) {
          conv.participant = {
            id: driver._id,
            name: driver.name,
            phone: driver.phone,
            vehicleNumber: driver.vehicleNumber,
            profileImage: driver.profileImage || '/images/driver-default.png',
            type: 'driver'
          };
        }
      }
    }

    res.status(200).json({ success: true, data: { conversations } });
  } catch (error) {
    console.error('Admin Get Conversations Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load conversations' });
  }
};

// Get messages
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name profileImage vehicleNumber')
      .lean();

    // Mark as read for admin
    await ChatMessage.updateMany(
      { conversationId, receiverType: 'Admin', isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({ success: true, data: { messages } });
  } catch (error) {
    console.error('Admin Get Messages Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load messages' });
  }
};

// SEND MESSAGE FROM ADMIN (with file upload support)
// exports.sendMessage = async (req, res) => {
//   try {
//     const admin = req.user;
//     let { driverId, content, messageType = 'text', location } = req.body;

//     if (!driverId) {
//       return res.status(400).json({ success: false, message: 'driverId is required' });
//     }

//     let mediaUrl = null;
//     let fileName = null;
//     let mimeType = null;

//     // File upload via Multer
//     if (req.file) {
//       mediaUrl = `/uploads/chat/${req.file.filename}`;
//       fileName = req.file.originalname;
//       mimeType = req.file.mimetype;

//       if (mimeType.startsWith('image/')) messageType = 'image';
//       else if (mimeType.startsWith('video/')) messageType = 'video';
//       else if (mimeType.startsWith('audio/')) messageType = 'audio';
//       else if (mimeType === 'application/pdf') messageType = 'document';
//       else messageType = 'document';
//     }

//     if (!content && !mediaUrl && messageType !== 'location') {
//       return res.status(400).json({ success: false, message: 'Content or media required' });
//     }

//     // Parse location if string
//     if (location && typeof location === 'string') {
//       try { location = JSON.parse(location); } catch (e) { location = null; }
//     }

//     const conversationId = generateConversationId('admin', driverId);

//     const message = await ChatMessage.create({
//       conversationId,
//       senderId: null, // Admin has no MongoDB ID
//       senderType: 'Admin',
//       receiverId: driverId,
//       receiverType: 'Driver',
//       messageType,
//       content: content || null,
//       mediaUrl,
//       fileName,
//       mimeType,
//       location: location || null,
//       isDelivered: true,
//       deliveredAt: new Date()
//     });

//     const messageObj = message.toObject();

//     // Real-time emit
//     if (global.io) {
//       const payload = {
//         conversationId,
//         message: {
//           ...messageObj,
//           sender: {
//             name: 'Support',
//             profileImage: '/images/support-avatar.png'
//           }
//         }
//       };

//       global.io.to(`driver-${driverId}`).emit('chat:new-message', payload);
//       global.io.to('admin-room').emit('chat:new-message', payload);
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Message sent successfully',
//       data: { message: messageObj }
//     });

//   } catch (error) {
//     console.error('Admin Send Message Error:', error);
//     res.status(500).json({ success: false, message: 'Failed to send message' });
//   }
// };

// SEND MESSAGE FROM ADMIN (fully multipart/form-data friendly)
exports.sendMessage = async (req, res) => {
  try {
    // All fields come from FormData → req.body
    const { driverId, content, messageType = 'text' } = req.body;

    // Location can come as string (JSON) or already parsed object
    let location = req.body.location;
    if (location && typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch {
        location = null;
      }
    }

    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'driverId is required'
      });
    }

    let mediaUrl = null;
    let fileName = null;
    let mimeType = null;
    let finalMessageType = messageType;

    // File handling (field name must be 'file')
    if (req.file) {
      mediaUrl = `/uploads/chat/${req.file.filename}`;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;

      // Auto-detect messageType from file if not provided
      if (mimeType.startsWith('image/')) finalMessageType = 'image';
      else if (mimeType.startsWith('video/')) finalMessageType = 'video';
      else if (mimeType.startsWith('audio/')) finalMessageType = 'audio';
      else if (mimeType === 'application/pdf' || mimeType.includes('document')) {
        finalMessageType = 'document';
      } else {
        finalMessageType = 'document'; // fallback
      }
    }

    // Validation: kuch to bhejna chahiye
    if (!content && !mediaUrl && finalMessageType !== 'location') {
      return res.status(400).json({
        success: false,
        message: 'Content or media or location is required'
      });
    }

    const conversationId = generateConversationId('admin', driverId);

    const message = await ChatMessage.create({
      conversationId,
      senderId: null,
      senderType: 'Admin',
      receiverId: driverId,
      receiverType: 'Driver',
      messageType: finalMessageType,
      content: content || null,
      mediaUrl,
      fileName,
      mimeType,
      location: location || null,
      isDelivered: true,
      deliveredAt: new Date()
    });

    const messageObj = message.toObject();

    // Socket.IO emit (same as before)
    if (global.io) {
      const payload = {
        conversationId,
        message: {
          ...messageObj,
          sender: {
            name: 'Support',
            profileImage: '/images/support-avatar.png'
          }
        }
      };

      global.io.to(`driver-${driverId}`).emit('chat:new-message', payload);
      global.io.to('admin-room').emit('chat:new-message', payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messageObj }
    });

  } catch (error) {
    console.error('Admin Send Message Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// EDIT MESSAGE (Admin)
exports.editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body || {};

    if (!content) {
      return res.status(400).json({ success: false, message: 'New content required' });
    }

    const message = await ChatMessage.findOne({
      _id: messageId,
      senderType: 'Admin',
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or not yours' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    if (global.io) {
      const payload = { conversationId: message.conversationId, message: message.toObject() };
      global.io.to('admin-room').emit('chat:message-edited', payload);
      const driverId = message.conversationId.split('_').find(id => id.length === 24);
      if (driverId) global.io.to(`driver-${driverId}`).emit('chat:message-edited', payload);
    }

    res.status(200).json({ success: true, message: 'Message edited' });
  } catch (error) {
    console.error('Admin Edit Error:', error);
    res.status(500).json({ success: false, message: 'Failed to edit' });
  }
};

// DELETE MESSAGE (Admin)
exports.deleteMessage = async (req, res) => {
  const data = { deleteForEveryone: false }; // Use object - safe even in catch

  try {
    const { messageId } = req.params;
    const body = req.body || {};

    // Update value safely
    data.deleteForEveryone = body.deleteForEveryone === true;

    const message = await ChatMessage.findOne({
      _id: messageId,
      senderType: 'Admin'
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedForEveryone = data.deleteForEveryone;

    await message.save();

    // Socket emit
    if (global.io) {
      const payload = {
        conversationId: message.conversationId,
        messageId: message._id,
        deletedForEveryone: data.deleteForEveryone
      };
      global.io.to('admin-room').emit('chat:message-deleted', payload);
      const driverId = message.conversationId.split('_').find(id => id.length === 24);
      if (driverId) global.io.to(`driver-${driverId}`).emit('chat:message-deleted', payload);
    }

    return res.status(200).json({
      success: true,
      message: data.deleteForEveryone ? 'Deleted for everyone' : 'Message deleted (for you)'
    });

  } catch (error) {
    console.error('Admin Delete Error:', error);

    // Now 100% safe - no ReferenceError possible
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete message',
      error: error.message,
      // Optional debug info (remove in production)
      attemptedDeleteForEveryone: data.deleteForEveryone
    });
  }
};

// RENDER: Chat Dashboard (list of conversations)
exports.renderChatDashboard = async (req, res) => {
  try {
    const admin = req.user;

    // Reuse your existing getConversations logic (but render EJS)
    const conversations = await ChatMessage.aggregate([
      { $match: { $or: [{ senderType: 'Admin' }, { receiverType: 'Admin' }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverType', 'Admin'] }, { $eq: ['$isRead', false] }] }, 1, 0]
            }
          }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } }
    ]);

    // Populate driver info
    for (let conv of conversations) {
      const driverId = conv._id.split('_').find(id => id !== 'admin');
      if (driverId) {
        const driver = await Driver.findById(driverId)
          .select('name phone vehicleNumber profileImage')
          .lean();

        if (driver) {
          conv.participant = {
            id: driver._id,
            name: driver.name || 'Unknown Driver',
            phone: driver.phone || 'N/A',
            vehicleNumber: driver.vehicleNumber || 'N/A',
            profileImage: driver.profileImage || '/img/avatar.png',
            type: 'driver'
          };
        } else {
          conv.participant = { name: 'Deleted Driver', type: 'driver' };
        }
      }
    }

    res.render('chat', {
      title: 'Admin Chat Dashboard',
      user: req.user,
      conversations,
      activeMenu: 'chat',
      url: req.originalUrl,
      messages: req.flash()
    });

  } catch (error) {
    console.error('Render Chat Dashboard Error:', error);
    req.flash('error', 'Failed to load chat conversations');
    res.redirect('/admin/dashboard');
  }
};

// RENDER: Single Conversation View
exports.renderConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // Find driver from conversationId
    const driverId = conversationId.split('_').find(id => id !== 'admin');
    if (!driverId) {
      req.flash('error', 'Invalid conversation');
      return res.redirect('/admin/chat');
    }

    const driver = await Driver.findById(driverId)
      .select('name phone vehicleNumber profileImage')
      .lean();

    if (!driver) {
      req.flash('error', 'Driver not found');
      return res.redirect('/admin/chat');
    }

    // Get messages (last 50 for performance, older ones via load more)
    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(50)
      .populate('senderId', 'name profileImage')
      .lean();

    // Mark messages as read for admin
    await ChatMessage.updateMany(
      { conversationId, receiverType: 'Admin', isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.render('chat_conversation', {
      title: `Chat with ${driver.name}`,
      user: req.user,
      driver,
      conversationId,
      chatMessages: messages,
      activeMenu: 'chat',
      url: req.originalUrl,
      messages: req.flash()
    });

  } catch (error) {
    console.error('Render Conversation Error:', error);
    req.flash('error', 'Failed to load conversation');
    res.redirect('/admin/chat');
  }
};