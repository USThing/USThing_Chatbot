const fetch = require('node-fetch');
const crypto = require('crypto');
const request = require('request');

const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN;
const FB_APP_SECRET = process.env.FB_APP_SECRET;

// Handles messages events
const handleMessage = (sender_psid, received_message) => {

  let response;

  // Checks if the message contains text
  if (received_message.text) {
    const data = received_message.nlp;
    if (data.entities.intent) {
      for (let i = 0; i < data.entities.intent.length; i++) {
        if (data.entities.intent[i].value === "class_schedule") {
          const action = require('./action/show_course');
          // response = {
          //   "text": 'Please wait as we are collecting useful data'
          // }
          // callSendAPI(sender_psid, response)
          var parameters = {courses: null, section: null}
          if (data.entities.Courses) {
            parameters.courses = data.entities.Courses[0].value;
            // console.log("the resolved course code is " + parameters.courses);
          }
          if (data.entities.Section) {
            parameters.section = data.entities.Section[0].value;
            // console.log("the resolved section code is " + parameters.section);
          }
          // console.log(action.reply(parameters));
          for (let result of action.reply(parameters)){
            response = {
              "text": result
            }
            callSendAPI(sender_psid, response);
            // console.log(`the response is ${result}`);
          }
        }
      }
    } else {
      // default logic
      response = {
        "text": 'Sorry I do not understand what you mean.'
      }

      // Sends the response message
      callSendAPI(sender_psid, response);
    }
  } else if (received_message.attachments) {
    // Get the URL of the message attachment
    let attachment_url = received_message.attachments[0].payload.url;
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": "You sent a picture. Is this the right picture?",
            "subtitle": "Tap a button to answer.",
            "image_url": attachment_url,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
  }
}

// Handles messaging_postbacks events
const handlePostback = (sender_psid, received_postback) => {
  let response;

  // Get the payload for the postback
  let payload = received_postback.payload;

  // Set the response based on the postback payload
  if (payload === 'yes') {
    response = { "text": "Thanks!" }
  } else if (payload === 'no') {
    response = { "text": "Oops, try sending another image." }
  }
  // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

const verifyRequestSignature = (req, res, buf) => {
  var signature = req.headers["x-hub-signature"];
  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
  let request_body = {
    "recipient": {
      "id": sender_psid
    },
    "message": response
  }
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": FB_PAGE_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}

module.exports.handleMessage = handleMessage;
module.exports.handlePostback = handlePostback;
module.exports.verifyRequestSignature = verifyRequestSignature;
