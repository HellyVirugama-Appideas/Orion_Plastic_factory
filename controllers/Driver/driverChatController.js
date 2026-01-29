const ChatMessage = require('../../models/Chatmessage');
const Driver = require('../../models/Driver');

// Helper to generate conversation ID (driver_admin)
const generateConversationId = (driverId) => `${driverId}_admin`;

// Get Driver Conversations (only one: Support)
exports.getDriverConversations = async (req, res) => {
  try {
    // CHANGE HERE: req.driver → req.user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const driverId = req.user._id;
    const driver = req.user; // ab req.user me driver hai

    const conversationId = generateConversationId(driverId);

    const lastMessage = await ChatMessage.findOne({ conversationId })
      .sort({ createdAt: -1 })
      .lean();

    const unreadCount = await ChatMessage.countDocuments({
      conversationId,
      receiverId: driverId,
      receiverType: 'Driver',
      isRead: false
    });

    const conversations = [{
      conversationId,
      participant: {
        id: 'admin',
        name: 'Support',
        type: 'admin',
        profileImage: '/images/support-avatar.png'
      },
      lastMessage: lastMessage ? {
        content: lastMessage.messageType === 'text' 
          ? lastMessage.content 
          : (lastMessage.messageType === 'image' ? 'Photo' : 'Media'),
        createdAt: lastMessage.createdAt,
        isFromMe: lastMessage.senderType === 'Driver'
      } : null,
      unreadCount,
      driverInfo: {
        name: driver.name,
        vehicleNumber: driver.vehicleNumber || 'Not assigned'
      }
    }];

    return res.status(200).json({
      success: true,
      data: { conversations }
    });

  } catch (error) {
    console.error('Driver Get Conversations Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load chats' });
  }
};

// Get Messages
exports.getDriverMessages = async (req, res) => {
  try {
    // CHANGE HERE: req.driver → req.user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { conversationId } = req.params;
    const driverId = req.user._id;

    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name profileImage vehicleNumber')
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

// Send Message from Driver
// exports.sendMessageFromDriver = async (req, res) => {
//   try {
//     if (!req.user || !req.user._id) {
//       return res.status(401).json({ success: false, message: 'Unauthorized' });
//     }

//     const driver = req.user;
//     let { content, messageType = 'text', location } = req.body;

//     // Parse location if sent as string (common in form-data)
//     if (location && typeof location === 'string') {
//       try {
//         location = JSON.parse(location);
//       } catch (e) {
//         location = null;
//       }
//     }

//     let mediaUrl = null;
//     let fileName = null;
//     let mimeType = null;

//     // Agar file upload hui hai (image, pdf, video etc.)
//     if (req.file) {
//       mediaUrl = `/uploads/chat/${req.file.filename}`;
//       fileName = req.file.originalname;
//       mimeType = req.file.mimetype;

//       // Auto detect messageType from mime
//       if (mimeType.startsWith('image/')) messageType = 'image';
//       else if (mimeType.startsWith('video/')) messageType = 'video';
//       else if (mimeType.startsWith('audio/')) messageType = 'audio';
//       else if (mimeType === 'application/pdf') messageType = 'document';
//       else messageType = 'document';
//     }

//     // Validation
//     if (!content && !mediaUrl && messageType !== 'location') {
//       return res.status(400).json({ success: false, message: 'Message content or media required' });
//     }

//     const conversationId = generateConversationId(driver._id);

//     const message = await ChatMessage.create({
//       conversationId,
//       senderId: driver._id,
//       senderType: 'Driver',
//       receiverId: null,
//       receiverType: 'Admin',
//       messageType,
//       content: content || null,
//       mediaUrl,
//       fileName,
//       mimeType,
//       location: location || null,
//       isDelivered: true,
//       deliveredAt: new Date()
//     });

//     await message.populate('senderId', 'name profileImage vehicleNumber');

//     const messageObj = message.toObject();

//     // Real-time emit
//     if (global.io) {
//       const payload = {
//         conversationId,
//         message: {
//           ...messageObj,
//           sender: {
//             _id: driver._id,
//             name: driver.name,
//             phone: driver.phone,
//             vehicleNumber: driver.vehicleNumber,
//             profileImage: driver.profileImage
//           }
//         }
//       };

//       global.io.to('admin-room').emit('chat:new-message', payload);
//       global.io.to(`driver-${driver._id}`).emit('chat:new-message', payload);
//     }

//     return res.status(201).json({
//       success: true,
//       message: 'Message sent successfully',
//       data: { message: messageObj }
//     });

//   } catch (error) {
//     console.error('Driver Send Message Error:', error);
//     return res.status(500).json({ success: false, message: 'Failed to send message' });
//   }
// };

exports.sendMessageFromDriver = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const driver = req.user;

    // Extract values from FormData (via multer)
    const content = req.body.content || '';                    
    let messageType = req.body.messageType || 'text';          
    let location = req.body.location || null;                  

    // Parse location if sent as string
    if (location && typeof location === 'string') {
      try {
        location = JSON.parse(location);
      } catch (e) {
        location = null;
      }
    }

    let mediaUrl = null;
    let fileName = null;
    let mimeType = null;

    // File upload check (image, video, pdf, etc.)
    if (req.file) {
      mediaUrl = `/uploads/chat/${req.file.filename}`;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;

      // Auto-detect messageType based on file
      if (mimeType.startsWith('image/')) messageType = 'image';
      else if (mimeType.startsWith('video/')) messageType = 'video';
      else if (mimeType.startsWith('audio/')) messageType = 'audio';
      else if (mimeType === 'application/pdf') messageType = 'document';
      else messageType = 'document';
    }

    // Validation
    if (!content && !mediaUrl && messageType !== 'location') {
      return res.status(400).json({
        success: false,
        message: 'Message content or media (file/location) is required'
      });
    }

    const conversationId = generateConversationId(driver._id);

    const message = await ChatMessage.create({
      conversationId,
      senderId: driver._id,
      senderType: 'Driver',
      receiverId: null,
      receiverType: 'Admin',
      messageType,
      content: content || null,
      mediaUrl,
      fileName,
      mimeType,
      location: location || null,
      isDelivered: true,
      deliveredAt: new Date()
    });

    await message.populate('senderId', 'name profileImage vehicleNumber');

    const messageObj = message.toObject();

    // Real-time socket emit
    if (global.io) {
      const payload = {
        conversationId,
        message: {
          ...messageObj,
          sender: {
            _id: driver._id,
            name: driver.name,
            phone: driver.phone,
            vehicleNumber: driver.vehicleNumber,
            profileImage: driver.profileImage
          }
        }
      };

      global.io.to('admin-room').emit('chat:new-message', payload);
      global.io.to(`driver-${driver._id}`).emit('chat:new-message', payload);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: { message: messageObj }
    });

  } catch (error) {
    console.error('Driver Send Message Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Edit Message
exports.editMessage = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { messageId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: 'New content required' });
    }

    const message = await ChatMessage.findOne({
      _id: messageId,
      senderId: req.user._id,
      senderType: 'Driver',
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or not yours' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('senderId', 'name profileImage vehicleNumber');

    const conversationId = message.conversationId;

    if (global.io) {
      const payload = {
        conversationId,
        message: {
          ...message.toObject(),
          sender: {
            _id: req.user._id,
            name: req.user.name,
            vehicleNumber: req.user.vehicleNumber,
            profileImage: req.user.profileImage
          }
        }
      };

      global.io.to('admin-room').emit('chat:message-edited', payload);
      global.io.to(`driver-${req.user._id}`).emit('chat:message-edited', payload);
    }

    return res.status(200).json({
      success: true,
      message: 'Message edited',
      data: { message }
    });

  } catch (error) {
    console.error('Edit Message Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to edit message' });
  }
};


// Delete Message
exports.deleteMessage = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { messageId } = req.params;
    const body = req.body || {}; // ← Safety
    const deleteForEveryone = body.deleteForEveryone === true; // ← Explicitly boolean banao

    const message = await ChatMessage.findOne({
      _id: messageId,
      senderId: req.user._id,
      senderType: 'Driver'
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found or not yours' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedForEveryone = deleteForEveryone;
    await message.save();

    const conversationId = message.conversationId;

    if (global.io) {
      const payload = {
        conversationId,
        messageId: message._id,
        deletedForEveryone: deleteForEveryone  // ← Yahan variable sahi se use karo
      };

      global.io.to('admin-room').emit('chat:message-deleted', payload);
      global.io.to(`driver-${req.user._id}`).emit('chat:message-deleted', payload);
    }

    return res.status(200).json({
      success: true,
      message: deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted'
    });

  } catch (error) {
    console.error('Delete Message Error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};

// Clear Chat (Delete for me only - driver side)
exports.clearChat = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const driverId = req.user._id;
    const conversationId = `${driverId}_admin`;

    // ⭐ FIX: req.body undefined ho sakta hai DELETE request me
    // Optional confirmation check - agar body hai to check karo, nahi to skip karo
    const body = req.body || {};
    const confirm = body.confirm;
    
    // Agar explicitly false bheja hai to error, otherwise proceed
    if (confirm === false) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation required. Send { "confirm": true } or just call the endpoint'
      });
    }

    // Soft delete - mark all messages in this conversation as deleted for this driver
    const updateResult = await ChatMessage.updateMany(
      {
        conversationId,
        // Only affect messages visible to this driver
        $or: [
          { receiverId: driverId, receiverType: 'Driver' },     // messages sent to driver
          { senderId: driverId, senderType: 'Driver' }          // messages sent by driver
        ],
        isDeleted: false  // Only delete messages that aren't already deleted
      },
      {
        $set: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedForEveryone: false   // important: not for everyone
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(200).json({
        success: true,
        message: 'Chat is already empty or cleared'
      });
    }

    // Optional: real-time notification to this driver
    if (global.io) {
      global.io.to(`driver-${driverId}`).emit('chat:cleared', {
        conversationId,
        clearedBy: 'driver',
        clearedAt: new Date()
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Chat cleared successfully',
      clearedMessagesCount: updateResult.modifiedCount
    });

  } catch (error) {
    console.error('Clear Chat Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear chat'
    });
  }
};
 

