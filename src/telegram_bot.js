const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TELEGRAM_BOT_APIKEY;
const bot = new TelegramBot(token, {polling: true});

module.exports.bot = bot;
