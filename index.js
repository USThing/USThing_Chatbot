'use strict';
require('dotenv').config()

const telegram_bot = require('./src/telegram_bot');

const fs = require('fs');
const courses_json = JSON.parse(fs.readFileSync('all_courses.json', 'utf8')).courses;

const moment = require('moment');

// const dialogflowHandler = require('./src/apiai_handler');

const witHandler = require('./src/witai_handler');

// telegram_bot.bot.on('message', (msg) => {
//   dialogflowHandler.textRequest(msg.text, msg.chat.id);
// });

telegram_bot.bot.on('message', (msg) => {
  witHandler.textRequest(msg.text, msg.chat.id);
});
