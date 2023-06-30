import { STATUSCODES } from "./consts.js"
import { getKeys } from "./helpers.js"
import { TransactionRepository } from "./repos.js"

export function TgOnMessageHandler(bot) {
    return async (body) => {
        try {
            let data = JSON.parse(body.content.toString())
            console.log(data + " Content")

            console.log(`Validation return data: ${data}`)

            // validateReturnData(content)

            let status_code_info = STATUSCODES[data.status_code]
            let tx_id = data.tx_id

            let ins = TransactionRepository.getInstance()
            console.log(`Transaction id: ${tx_id}, Keys ${getKeys(data)}`)
            ins.getByID(tx_id, async (err, tx) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (tx === null || tx === undefined) {
                    console.error("Cannot pull transaction id")
                    return
                }
                console.log("WHATAFAK")
                ins.getUserByTransaction(tx_id, async (err, user) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    if (user === null || user === undefined) {
                        console.error("Can't pull users with transaction ids;")
                        return
                    }
                    const Keyboard = {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "👤 Тех поддержка 👤",
                                        callback_data: "helpAdmin"
                                    }
                                ]
                            ]
                        }
                    }
                    if (data.status_code == 200) { 
                        await ins.acceptIt(tx_id, user.userId, (err, row) => {console.log(`TRANSACTION COMPLETED, for ${user.userId}, TX_ID: ${tx_id}`)})
                    }
                    await bot.sendMessage(user.userId, `✅ Ваша заявка на вывод была отработана, вот ее вывод: \n ${status_code_info}`, Keyboard)
                })
            })

            return true

        } catch (err) {
            console.error(err)
        }
    }
}

export async function startHandler(bot) {
    return async (msg) => {
        const chatId = msg.chat.id;
        const telegramUsername = msg.from.username;
        const userId = msg.from.id;
        const currentTime = new Date().toISOString();

        bot.sendMessage(chatId, "Приветствую тебя в моем магазине робуксов)\nНиже предоставлено мое меню. Для того, чтобы вызвать меню заново, используй клавиатуру Вызвать меню", againMenu);
        bot.sendMessage(chatId, "Вот мое меню:", Keyboard);

        db.get(`SELECT chatState FROM users WHERE tg_id = ?`, [userId], (err, row) => {
            if (err) {
                console.error(err.message);
                return;
            }
            let chatState = 'NormalUserState';
            if (row && row.chatState) {
                chatState = row.chatState;
            } else {
                db.run(`INSERT INTO users (telegramUsername, userId, timeReg) VALUES (?, ?, ?)`, [telegramUsername, userId, currentTime], function (err) {
                    if (err) {
                        console.error(err.message);
                        return;
                    }
                    console.log(`User ${telegramUsername} (${userId}) inserted into the database.`);
                });
            }
        });
    }
}

export function addBalance(bot) {
    return async (msg, match) => {
        const chatId = msg.chat.id;
        const adminUserId = msg.from.id;
        const targetUserId = parseInt(match[1]);
        const amount = parseInt(match[2]);
        if (isAdminUser(adminUserId)) {
            // Вызов функции для пополнения баланса пользователя
            increaseUserBalance(targetUserId, amount, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Баланс пользователя с ID ${targetUserId} успешно пополнен на ${amount}`);
                } else {
                    bot.sendMessage(chatId, `Не удалось пополнить баланс пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    }
}

export function minusBalance(bot) {
    return (msg, match) => {
        const chatId = msg.chat.id;
        const adminUserId = msg.from.id;
        const targetUserId = parseInt(match[1]);
        const amount = parseInt(match[2]);
        if (isAdminUser(adminUserId)) {
            // Вызов функции для пополнения баланса пользователя
            minusUserBalance(targetUserId, amount, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Баланс пользователя с ID ${targetUserId} успешно понижен на ${amount}`);
                } else {
                    bot.sendMessage(chatId, `Не удалось понизить баланс пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    }
}

export function blockUserHandler(bot) {
    return async (msg, match) => {
        const chatId = msg.chat.id;
        const adminUserId = msg.from.id;
        const targetUserId = parseInt(match[1]);
        if (isAdminUser(adminUserId)) {
            blockUser(targetUserId, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Пользователь с ID ${targetUserId} успешно заблокирован`);
                } else {
                    bot.sendMessage(chatId, `Не удалось заблокировать пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    }
}
