'use strict';
require('dotenv').config()

const telegram_bot = require('./src/telegram_bot');
const fbmessenger = require('./src/fbmessenger');

const fs = require('fs');
const courses_json = JSON.parse(fs.readFileSync('all_courses.json', 'utf8')).courses;
const express = require('express');
const moment = require('moment');
const bodyParser = require('body-parser');
const crypto = require('crypto');
// const dialogflowHandler = require('./src/apiai_handler');

const witHandler = require('./src/witai_handler');

// telegram_bot.bot.on('message', (msg) => {
//   dialogflowHandler.textRequest(msg.text, msg.chat.id);
// });

const app = express();
const PORT = process.env.PORT || 8080;

app.use(bodyParser.json({ verify: fbmessenger.verifyRequestSignature }));
app.use(bodyParser.urlencoded({ extended: true }));
app.get('/', (req, res) => res.send('welcome to the root'));

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = process.env.VERIFY_TOKEN

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the body of the webhook event
      let webhook_event = entry.messaging[0];
      console.log(webhook_event);

      // Get the sender PSID
      let sender_psid = webhook_event.sender.id;
      console.log('Sender PSID: ' + sender_psid);

      // Check if the event is a message or postback and
      // pass the event to the appropriate handler function
      if (webhook_event.message) {
        fbmessenger.handleMessage(sender_psid, webhook_event.message);
      } else if (webhook_event.postback) {
        fbmessenger.handlePostback(sender_psid, webhook_event.postback);
      }

    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});

app.listen(PORT, () => console.log(`app listening on port ${PORT}`));

telegram_bot.bot.on('message', (msg) => {
  witHandler.textRequest(msg.text, msg.chat.id);
});
