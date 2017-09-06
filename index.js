'use strict';
require('dotenv').config()

const telegram_bot = require('./src/telegram_bot');

const fs = require('fs');
const courses_json = JSON.parse(fs.readFileSync('all_courses.json', 'utf8')).courses;

const moment = require('moment');

const handler = require('./src/apiai_handler');

telegram_bot.bot.on('message', (msg) => {
  handler.textRequest(msg.text, msg.chat.id);
});
