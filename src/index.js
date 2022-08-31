const TelegramBot = require("node-telegram-bot-api");
const { MongoClient } = require("mongodb");
const { token, MONGO_URI, url, MY_ID } = require("./secrets.json");
const { q1, q2, q3, startMessage, instructionsMessage, thankYouMessage, errorMessage } = require("./messages.json")

let client = new MongoClient(MONGO_URI, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});

let bot = new TelegramBot(token, {
  webHook: {
    port: process.env.PORT,
  }
});

bot.setWebHook(`${url}/bot${token}`);

let MYID = parseInt(MY_ID);

client.connect((err, client) => {
  let users = client.db("tmtm").collection("Users");

  bot.on("message", (msg) => {
    if (msg.from.id === MYID) {
      if (msg.text === "/start") {
        bot.sendMessage(msg.chat.id, startMessage);
      } else if (msg.text === "/instructions") {
        bot.sendMessage(msg.chat.id, instructionsMessage);
      } else if (msg.text === "/dev") {
        bot.sendMessage(
          msg.chat.id,
          "Telegram: @israelsgalaxy\nEmail: izzygaladima@gmail.com"
        );
      } else {
        try {
          let pep = msg.text.split("-");
          let him = JSON.parse(pep.shift());
          let toSend = "Matches found\n\n";

          pep.forEach((val, i, arr) => {
            let t = val.trim();
            let user = JSON.parse(t);

            bot.sendMessage(
              user.userId,
              `Matches found\n\nLevel: ${him.level}\nLocation: ${him.location}\nContact: ${him.contact}`
            );
            toSend += `Level: ${user.level}\nLocation: ${user.location}\nContact: ${user.contact}\n\n`;
          });

          bot.sendMessage(him.userId, toSend);
          bot.sendMessage(MYID, `Sent`);
        } catch (error) {
          console.error(error);
          bot.sendMessage(MYID, "Not sent");
        }
      }
    } else {
      if (msg.text === "/start") {
        bot.sendMessage(msg.chat.id, startMessage);
      } else if (msg.text === "/instructions") {
        bot.sendMessage(msg.chat.id, instructionsMessage);
      } else if (msg.text === "/dev") {
        bot.sendMessage(
          msg.chat.id,
          "Telegram: @israelsgalaxy\nEmail: izzygaladima@gmail.com"
        );
      } else if (msg.text === "/unlist") {
        users
          .deleteOne({
            userId: msg.from.id,
          })
          .then((res) => {
            bot.sendMessage(msg.chat.id, "I'd stop sending you ride partners");
          })
          .catch((err) => {
            console.error(err);
            bot.sendMessage(msg.chat.id, errorMessage);
          });
      } else if (msg.text === "/list") {
        bot.sendMessage(msg.chat.id, q1);
      } else {
        if (msg.reply_to_message) {
          if (
            msg.reply_to_message.text === q1 &&
            msg.reply_to_message.from.is_bot === true
          ) {
            // do something
            users
              .updateOne(
                {
                  userId: msg.from.id,
                },
                {
                  $set: {
                    level: msg.text.trim().replace(/\s/g, " "),
                  },
                },
                {
                  upsert: true,
                }
              )
              .then((up) => {
                bot.emit("state", msg.chat.id, q1, "");
              })
              .catch((err) => {
                console.error(err);
                bot.sendMessage(msg.chat.id, errorMessage);
              });
          } else if (
            msg.reply_to_message.text === q2 &&
            msg.reply_to_message.from.is_bot === true
          ) {
            // do something
            users
              .updateOne(
                {
                  userId: msg.from.id,
                },
                {
                  $set: {
                    contact: msg.text.trim().replace(/\s/g, " "),
                  },
                },
                {
                  upsert: true,
                }
              )
              .then((up) => {
                bot.emit("state", msg.chat.id, q2, "");
              })
              .catch((err) => {
                console.error(err);
                bot.sendMessage(msg.chat.id, errorMessage);
              });
          } else if (
            msg.reply_to_message.text === q3 &&
            msg.reply_to_message.from.is_bot === true
          ) {
            // do something
            users
              .updateOne(
                {
                  userId: msg.from.id,
                },
                {
                  $set: {
                    location: msg.text.trim().replace(/\s/g, " "),
                  },
                },
                {
                  upsert: true,
                }
              )
              .then((up) => {
                bot.emit("state", msg.chat.id, q3, msg.text);
              })
              .catch((err) => {
                console.error(err);
                bot.sendMessage(msg.chat.id, errorMessage);
              });
          }
        } else {
          bot.sendMessage(
            msg.chat.id,
            `You weren't meant to send that. Did you forget to "reply to" a question properly? Have you read the bot instructions?`
          );
        }
      }
    }
  });

  bot.on("state", async (chatId, doneMsgText, locationText) => {
    if (doneMsgText === q1) {
      bot.sendMessage(chatId, q2);
    } else if (doneMsgText === q2) {
      bot.sendMessage(chatId, q3);
    } else if (doneMsgText === q3) {
      bot.sendMessage(chatId, thankYouMessage);

      users
        .findOne({
          userId: chatId,
        })
        .then((user) => {
          bot.sendMessage(
            MYID,
            `{"userId": "${user.userId}","level": "${user.level}","contact": "${user.contact}","location": "${user.location}"}`
          );
        })
        .catch((err) => {
          console.error(err);
          bot.sendMessage(chatId, errorMessage);
        });
    } else {
      bot.sendMessage(
        msg.chat.id,
        "I received improper data from you. Please try again."
      );
    }
  });
});

bot.on("error", (err) => {
  console.error(err);
});

bot.on("polling_error", (err) => {
  console.error(err);
});

bot.on("webhook_error", (err) => {
  console.error(err);
});
