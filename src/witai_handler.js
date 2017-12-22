'use strict';

const telegram_bot = require('./telegram_bot');

const witai = require('node-wit');

const client = witai.Wit({accessToken: process.env.WITAI_APIKEY});

const textRequest = (text, sessionID) => {

    client.message(text, {})
    .then((data) => {
        console.log('Yay, got Wit.ai response: ' + JSON.stringify(data));
        if (!data.entities.intent) {
            telegram_bot.bot.sendMessage(sessionID, 'sorry I do not understand what you mean.');
            return;
        }
        for (let i = 0; i < data.entities.intent.length; i++) {
            if (data.entities.intent[i].value === "class_schedule") {
                const action = require('./action/show_course');
                telegram_bot.bot.sendMessage(sessionID, 'Please wait as we are collecting useful data')
                .then(() => {
                    var parameters = {courses: null, section: null}
                    if (data.entities.Courses) {
                        parameters.courses = data.entities.Courses[0].value;
                        // console.log("the resolved course code is " + parameters.courses);
                    }
                    if (data.entities.Section) {
                        parameters.section = data.entities.Section[0].value;
                        // console.log("the resolved section code is " + parameters.section);
                    }
                    sendMessage(action.reply(parameters), sessionID);
                });
            }
        }
    })
    .catch(console.error);

}

async function sendMessage(messages, sessionID) {
    // console.log("sending messages: " + messages);
    const options = {
        parse_mode: 'Markdown'
    }
    for (let i = 0; i < messages.length; i++) {
        await telegram_bot.bot.sendMessage(sessionID, messages[i], options);
    }
}

module.exports.textRequest = textRequest;
