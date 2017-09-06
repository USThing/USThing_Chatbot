# USThing Chatbot

The chatbot can now be found on Telegram with username [@hkust_class_quota_bot](https://t.me/hkust_class_quota_bot).

## Structure

```
.env                    // api key here, should not be pushed on github
src/
... action/             // put any chatbot actions here
... apiai_handler.js    // handle api.ai request and respond
... telegram_bot.js     // handle telegram bot setting
all_courses.json        // dummy courses json file
index.js
```

## Development
1. Ask repo admin for the api key
2. `npm install` or `yarn install` if you love yarn
3. Develop your own action in `src/action/`
4. Add action to the [api.ai](http://api.ai), the action js file should match the action on api.ai
5. Pull request ❤️

## Features
- [x] Show Class schedule and quota
- [ ] Integrate with Facebook Messenger
- [ ] Repeatly remind class scheudle and quota
- [ ] Book facilities
- [ ] Answer questions