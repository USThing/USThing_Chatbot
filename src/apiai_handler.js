'use strict';

const telegram_bot = require('./telegram_bot');

const apiai = require('apiai');
const app = apiai(process.env.APIAI_APIKEY);

const textRequest = (text, sessionID) => {
  const request = app.textRequest(text, {
      sessionId: sessionID
  });

  request.on('response', function(response) {
    if (!response.result.action.includes('class')) {
      telegram_bot.bot.sendMessage(sessionID, response.result.fulfillment.speech);
      return;
    }

    const action = require('./action/' + response.result.action.replace('class.',''));
    telegram_bot.bot.sendMessage(sessionID, response.result.fulfillment.speech)
      .then(() => {
        sendMessage(action.reply(response.result.parameters), sessionID);
      });
  });

  request.on('error', function(error) {
    console.log(error);
  });

  request.end();
};

async function sendMessage(messages, sessionID) {
  const options = {
    parse_mode: 'Markdown'
  }
  for (let i = 0; i < messages.length; i++) {
    await telegram_bot.bot.sendMessage(sessionID, messages[i], options);
  }
}

module.exports.textRequest = textRequest;
