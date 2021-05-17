const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const serviceAccount = require('PATH TO SERVICE ACCOUNT JSON KEYS');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
router.post('/notify-single', async (req, res) => {
  const {
    token: registrationToken,
    title: messageTitle,
    message: messageBody,
  } = req.body;
  const message = {
    notification: {
      title: messageTitle,
      body: messageBody,
    },
    token: registrationToken,
  };
  admin
    .messaging()
    .send(message)
    .then(() => {
      res.json({
        message: 'Notification sent!',
        success: true,
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        message: 'Notification not sent:(',
        success: false,
      });
    });
});

router.post('/notify-multiple', async (req, res) => {
  const {
    tokens: registrationTokens,
    title: messageTitle,
    message: messageBody,
  } = req.body;

  const message = {
    notification: {
      title: messageTitle,
      body: messageBody,
    },
    tokens: registrationTokens,
  };

  admin
    .messaging()
    .sendMulticast(message)
    .then((response) => {
      res.json({
        message: 'Notification sent to ' + response.successCount,
        success: true,
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        message: 'Notification not sent:(',
        success: false,
      });
    });
});

router.post('/notify-topic', async (req, res) => {
  const { topic, title: messageTitle, message: messageBody } = req.body;

  const message = {
    notification: {
      title: messageTitle,
      body: messageBody,
    },
    topic: topic,
  };
  admin
    .messaging()
    .send(message)
    .then(() => {
      // Response is a message ID string.
      res.json({
        message: 'Notification sent!',
        success: true,
      });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        message: 'Notification not sent:(',
        success: false,
      });
    });
});

module.exports = router;
