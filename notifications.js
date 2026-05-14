const admin = require('firebase-admin');
const serviceAccount = require('./firebase.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendNotification(token, title, body, link) {
  try {
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: {
        link: link || ''
      },
      token: token
    };

    const response = await admin.messaging().send(message);
    console.log('تم إرسال الإشعار! 🔔 ' + response);
    return true;
  } catch (error) {
    console.log('خطأ في الإشعار: ' + error.message);
    return false;
  }
}

module.exports = { sendNotification };
console.log('نظام الإشعارات جاهز! ✅');