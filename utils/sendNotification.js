const admin = require('firebase-admin');
// const serviceAccount = require('./orionplastic-396de-firebase-adminsdk-fbsvc-cd15cc7779.json');


let serviceAccount;

try {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!serviceAccountString) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON in environment variables');
  }

  // Parse the string back to object
  serviceAccount = JSON.parse(serviceAccountString);
  
  console.log('Firebase Admin SDK initialized successfully from environment variable');
} catch (err) {
  console.error('Firebase initialization failed:', err.message);
  // Optional: in production you can choose to continue or crash
  // process.exit(1); // uncomment if you want the app to stop if config is missing
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });


// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const messaging = admin.messaging();

const getNotificationContent = (type, language, name) => {
  // Add more languages later if needed
  switch (type) {
    case 'delivery_assigned':
      return {
        title: "New Delivery Assigned",
        body: `Hello ${name}, a new delivery has been assigned to you. Please check details in the app.`
      };
    case 'delivery_updated':
      return {
        title: "Delivery Updated",
        body: `Hello ${name}, one of your assigned deliveries has been updated.`
      };
    case 'delivery_cancelled':
      return {
        title: "Delivery Cancelled",
        body: `Hello ${name}, one of your deliveries has been cancelled.`
      };
    default:
      return {
        title: "Notification",
        body: `Hello ${name}, you have a new update.`
      };
  }
};

const sendNotification = async (name, language, registrationToken, type, data = {}) => {
  if (!registrationToken || typeof registrationToken !== 'string' || registrationToken.trim() === '') {
    console.warn(`No valid token provided for ${type}`);
    return null;
  }

  const { title, body } = getNotificationContent(type, language, name);

  const message = {
    token: registrationToken,
    notification: { title, body },
    data: {
      ...data,
      type,
      click_action: "FLUTTER_NOTIFICATION_CLICK"
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
          'content-available': 1
        }
      }
    },
    android: { priority: 'high' }
  };

  try {
    const response = await messaging.send(message);
    console.log(`[${type}] Sent to ${registrationToken}:`, response);
    return response;
  } catch (error) {
    console.error(`[${type}] Error sending to ${registrationToken}:`, error.code || error.message);
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.code === 'messaging/invalid-registration-token') {
      // TODO: Remove this token from DB
    }
    return null;
  }
};

const sendNotificationsToTokens = async (title, body, registrationTokens, data = {}) => {
  const validTokens = registrationTokens.filter(t => t && typeof t === 'string' && t.trim() !== '');

  if (validTokens.length === 0) {
    console.log('No valid tokens');
    return { successCount: 0, failureCount: 0 };
  }

  const message = {
    notification: { title, body },
    data,
    apns: {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
          'content-available': 1
        }
      }
    },
    android: { priority: 'high' },
    tokens: validTokens
  };

  try {
    const response = await messaging.sendMulticast(message);
    console.log(`Multicast → Success: ${response.successCount}, Failed: ${response.failureCount}`);

    if (response.failureCount > 0) {
      // Optional: log & clean invalid tokens (add your DB logic here)
    }

    return {
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (err) {
    console.error('Multicast failed:', err);
    return { successCount: 0, failureCount: validTokens.length };
  }
};

module.exports = {
  sendNotification,           // single user
  sendNotificationsToTokens   // multiple users (same content)
};