const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
var serviceAccount = require('PATH TO SERVICE ACCOUNT JSON KEYS');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
router.post('/notify-single', async (req, res) => {
    var registrationToken=req.body.token;
    var messageTitle = req.body.title;
    var messageBody = req.body.message;
    var message = {
        notification: {
          title: messageTitle,
          body: messageBody
        },
        token: registrationToken
    };
    admin.messaging().send(message)
  .then((response) => {
    res.json({
        message: "Notification sent!",
        success: true
    })
  })
  .catch((error) => {
    console.log(error);
    res.json({
      message: "Notification not sent:(",
      success: false
  })
  });
});

router.post('/notify-multiple', async (req, res) => {
    var registrationTokens=req.body.tokens;
    var messageTitle = req.body.title;
    var messageBody = req.body.message;
      
      const message = {
        notification:{
            title: messageTitle,
            body: messageBody
        },
        tokens: registrationTokens,
      }
      
      admin.messaging().sendMulticast(message)
        .then((response) => {
          res.json({
            message: "Notification sent to "+response.successCount,
            success: true
        })
          }).catch((error)=>{
            console.log(error);
            res.json({
              message: "Notification not sent:(",
              success: false
          })
          });
});

router.post('/notify-topic', async (req, res) => {
    var topic=req.body.topic;
    var messageTitle = req.body.title;
    var messageBody = req.body.message;
      
      const message = {
        notification:{
            title: messageTitle,
            body: messageBody
        },
        topic:topic,
      };
    admin.messaging().send(message)
      .then((response) => {
        // Response is a message ID string.
        res.json({
          message: "Notification sent!",
          success: true
      })
      })
      .catch((error) => {
        console.log(error);
        res.json({
          message: "Notification not sent:(",
          success: true
      })
      });
})

module.exports = router;



