const admin = require('firebase-admin');
const path = require('path');

let isInitialized = false;

try {
    const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    isInitialized = true;
    console.log("Firebase Admin Initialized Successfully");
} catch (error) {
    console.warn("Firebase Admin Initialization Failed (Missing serviceAccountKey.json?)", error.message);
}

const sendWakeUpPush = async (fcmToken) => {
    if (!isInitialized || !fcmToken) return;

    const message = {
        data: {
            type: "WAKE_UP",
            priority: "high"
        },
        android: {
            priority: "high"
        },
        // "token" property tells FCM where to send.
        token: fcmToken
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent wake-up message:', response);
    } catch (error) {
        console.error('Error sending wake-up message:', error);
    }
};

module.exports = { sendWakeUpPush };
