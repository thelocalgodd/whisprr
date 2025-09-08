const admin = require('firebase-admin');

const initializeFirebase = () => {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('Firebase Admin initialized successfully');
    return admin;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return null;
  }
};

module.exports = { initializeFirebase, admin };