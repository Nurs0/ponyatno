import TelegramBot from 'node-telegram-bot-api';
import { sendURLToRabbitMq, connectToRabbitMQ } from './src/publisher.js';
import { createConsumer, runConsumer, createConsumerInfo } from './src/consumer.js';
import { EXCHANGE_RETURN_KEY, QUEUE_NAME, QUEUE_RETURN_NAME } from './src/consts.js';
import { TgOnMessageHandler } from './src/handlers.js';
import { createTables } from './src/repos.js';
import { SQLiteConnector } from './src/db.js';

let numberRobuxes = 0
const db = new SQLiteConnector("./database.db")
const bot = new TelegramBot("6027789742:AAH4q7PY4ixWWoFPcIVWWOGrzHHlQLBH2-E", { polling: true });
const AMQP_URL = "amqp://user:password@localhost:5672/test?heartbeat=0"

try {
    db.connect()
    createTables(db)
    connectToRabbitMQ(AMQP_URL, QUEUE_NAME)
    createConsumer(AMQP_URL, createConsumerInfo(QUEUE_RETURN_NAME, EXCHANGE_RETURN_KEY), TgOnMessageHandler(bot)).then(() => {
        runConsumer()
    })
} catch (err) {
    console.error(err)
}

let chatState = {};
let transfer_count = {};
let urls = {};
let Dividednumber;
let payment;
let vivodNumber;
let specialUserId
let costnumber


function isValidHttpUrl(string) {
    try {
        const newUrl = new URL(string);
        return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
    } catch (err) {
        return false;
    }
}

bot.on("callback_query", (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const messageId = callbackQuery.message.message_id;
    if (data === "buyRobux") {
        const message = `💸 Какое количество робуксов вы желаете купить?\n✅ [Курс робуксов: 1 руб - 1.9 робукс]`;
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        });
        chatState[chatId] = "waitMoneyAmount"
    } else if (data === "calculator") {
        bot.editMessageText("🧮 Это - калькулятор, для подсчета стоимости робуксов, и правильного определения суммы геймпасса!\n✅ [Курс робуксов -> 1 руб - 1.9 робукса]\n", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Подсчитать стоимость геймпасса",
                            callback_data: "gamepassCostCalculator",
                        }
                    ],
                    [
                        {
                            text: "Подсчитать стоимость робуксов",
                            callback_data: "robuxCostCalculator",
                        }
                    ],
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu",
                        }
                    ]
                ]
            }
        })
    } else if (data === "giveaway") {
        const userId = callbackQuery.from.id;
        db.get(`SELECT userBalance FROM users WHERE userId = ?`, [userId], function (err, row) {
            if (err) {
                return console.error(err.message);
            }
            const balance = row ? row.userBalance : 0;
            bot.editMessageText(`💸 Ваш текующий баланс робуксов: ${balance}\n❓ Сколько робуксов вы хотите вывести?`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Вернуться назад",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            })
            chatState[chatId] = "vivodMoney"
        })

    } else if (data === "profile") {
        const userId = callbackQuery.from.id;
        db.get(`SELECT userBalance FROM users WHERE userId = ?`, [userId], function (err, row) {
            if (err) {
                return console.error(err.message);
            }
            const balance = row ? row.userBalance : 0;
            const profile = `
👤 Ваш профиль: 
🆔 Ваш айди - ${chatId}
💰 Ваш баланс - ${balance} робуксов
        `
            bot.editMessageText(profile, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Пополнить баланс",
                                callback_data: "buyRobux"
                            }
                        ],
                        [
                            {
                                text: "Вернуться назад",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            })
        })

    } else if (data === "balance") {
        const userId = callbackQuery.from.id;
        db.get(`SELECT userBalance FROM users WHERE userId = ?`, [userId], function (err, row) {
            if (err) {
                return console.error(err.message);
            }
            const balance = row ? row.userBalance : 0;
            bot.editMessageText(`☁️ Ваш текующий баланс: ${balance} робуксов\n ✔️ Вы можете пополнить баланс по кнопка ниже:`, {
                chat_id: chatId,
                message_id: messageId,
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Пополнить баланс",
                                callback_data: "buyRobux"
                            }
                        ],
                        [
                            {
                                text: "Вернуться назад",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            })
        })

    } else if (data === "newsChanel") {
        bot.editMessageText(`✅ Воспользуйтесь кнопками ниже:`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Новостной канал",
                            url: "t.me/cloudrobux"
                        }
                    ],
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
    } else if (data === "helpAdmin") {
        bot.editMessageText(`😊 Наши операторы доступны для технической поддержки круглосуточно, 24/7. \n✅ Используйте команду ниже, чтобы связаться с ними.`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Тех поддержка",
                            url: "t.me/DeluxeryOwner"
                        }
                    ],
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
    } else if (data === "backToMenu") {
        const message = "Вот мое меню:";
        chatState[chatId] = "userState"
        bot.editMessageText(message, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "👤 Профиль 👤",
                            callback_data: "profile"
                        }
                    ],
                    [
                        {
                            text: "🛍️ Инструкция",
                            callback_data: "instruction"
                        },
                        {
                            text: "Наличие 🤑",
                            callback_data: "proverkaRBX"
                        }
                    ],
                    [
                        {
                            text: "💳 Купить Robux",
                            callback_data: "buyRobux"
                        },
                        {
                            text: "Вывести Robux 🎁",
                            callback_data: "giveaway"
                        }
                    ],
                    [
                        {
                            text: "💰 Баланс",
                            callback_data: "balance"
                        },
                        {
                            text: 'Калькулятор 🧮',
                            callback_data: "calculator"
                        }
                    ],
                    [
                        {
                            text: "❓ Поддержка",
                            callback_data: "helpAdmin"
                        },
                        {
                            text: "Новости 📢",
                            callback_data: "newsChanel"
                        }
                    ]
                ]
            }
        })
    } else if (data === "paySberbank") {
        payment = "Сбербанк"
        bot.editMessageText(`
Сбер 💚

Карта - 2202206712973333
Номер - +79524452938 

❗️Работает СБП 💞
        `, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Я оплатил",
                            callback_data: "userOplatil"
                        }
                    ],
                    [
                        {
                            text: "Назад",
                            callback_data: "buyRobux"
                        }
                    ]
                ]
            }
        })
    } else if (data === "payQIWI") {
        payment = "Киви"
        bot.editMessageText(`
Киви 🥝 - 
Карта - 4890494791238728 
Номер - +79049264285 

❗️Работает СБП 💞
        `, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Я оплатил",
                            callback_data: "userOplatil"
                        }
                    ],
                    [
                        {
                            text: "Назад",
                            callback_data: "buyRobux"
                        }
                    ]
                ]
            }
        })
    } else if (data === "userOplatil") {
        bot.editMessageText(`✅ Ваша заявка принята! \n⏰ Ожидайте пополнение в течении 3-х часов!`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться в меню",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Пополнить этой дуре баланс", callback_data: "avtoPopolnenyieDlyaZayavka"
                        }
                    ]
                ]
            }
        }
        bot.sendMessage(-946513065, `Поступила заявка от пользователя ${chatId}, на сумму ${Dividednumber} рублей!\nОплата была сделана через ${payment}`, keyboard)
        specialUserId = chatId
        return specialUserId
    } else if (data === "gamepassCostCalculator") {
        bot.editMessageText("✅ Напишите сумму которую вы хотите получить, а я высчитаю сколько должен стоить геймпасс!", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "calculator"
                        }
                    ]
                ]
            }
        })
        chatState[chatId] = "gamepassCostCalculator"
    } else if (data === "robuxCostCalculator") {
        bot.editMessageText("✅ Напишите количество робуксов которые вы хотите купить, а я высчитаю сколько вы должны будете заплатить рублей!", {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться назад",
                            callback_data: "calculator"
                        }
                    ]
                ]
            }
        })
        chatState[chatId] = "robuxCostCalculator"
    } else if (data === "vivodDa") {
        bot.editMessageText(`Вы собираетесь выводить ${vivodNumber} робуксов! \nТеперь введите ссылку на геймпасс:`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться в меню",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
        chatState[chatId] = "linkwait"
        console.log(chatState[chatId])

    } else if (data === "otmenaPayment") {
        bot.editMessageText(`отменилась покупка`, {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться в меню",
                            callback_data: "backToMenu"
                        }
                    ]
                ]
            }
        })
        chatState[chatId] = "linkwait2"
        console.log(chatState[chatId])
    } else if (data === "avtoPopolnenyieDlyaZayavka") {
        function increaseUserBalance(userId, amount, callback) {
            db.execute(
                `UPDATE users SET userBalance = userBalance + ? WHERE userId = ?`,
                [amount, userId],
                function (err) {
                    if (err) {
                        console.error(err.message);
                        callback({ success: false });
                    } else {
                        callback({ success: true });
                    }
                }
            );
        }
        const adminUserId = 809124390
        const targetUserId = specialUserId
        const amount = Math.round(Dividednumber * 1.9)
        if (isAdminUser(adminUserId)) {
            // Вызов функции для пополнения баланса пользователя
            increaseUserBalance(targetUserId, amount, (result) => {
                if (result.success) {
                    bot.sendMessage(chatId, `Баланс пользователя с ID ${targetUserId} успешно пополнен на ${amount}`);
                    bot.sendMessage(targetUserId, `Заявка на пополнение баланса одобрена администратором. Ваш баланс пополнен на - ${amount} робуксов`)
                } else {
                    bot.sendMessage(chatId, `Не удалось пополнить баланс пользователя с ID ${targetUserId}`);
                }
            });
        } else {
            bot.sendMessage(chatId, "У вас нет прав на выполнение этой команды");
        }
    } else if (data === "proverkaRBX") {
        bot.sendMessage(chatId, `В данный момент наличие составляет: ${numberRobuxes} робуксов!`)
    } else if (data === "instruction") {
        const keyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: "Вернуться в меню",
                            callback_data: "backToMenu"
                        }
                    ],
                    [
                        {
                            text: "Тех поддержка",
                            callback_data: "helpAdmin"
                        }
                    ]
                ]
            }
        }
        bot.sendMessage(chatId,
            `
        Гайд #1 
        ✨Тема: Создание GamePass и копирование ссылки. 
        
        ☁️Данный гайд расписан по шагам, советуем следовать им. 
        
        ⚠️ И так начнем , нам понадобиться браузер, желательно Яндекс. 
        
        1. Заходим на сайт Roblox 
        2. В браузере нажимаем «Версия для компьютера» 
        3. Нажимаем Create 
        4. Нажимаем Manage my games 
        5. Вас бросит на вкладку ваши режимы, там нажимаем на первый режим (желательно) 
        6. Вверху нажимаем на 3 полоски. 
        7. Ищем вкладку Associated items и нажимаем туда.
        8. Ищем вкладку Passes и нажимаем на Create Pass 
        9. Создаем GamePass и жмем на 3 полоски. 
        10. Выбираем sales
        11. Нажимаем на on sale и ставим цену (что бы пришло 700 ставим 1000) 
        
        ✔️GamePass сделан✔️
        
        ❓Откуда взять ссылку ? 
        
        1. Заходим на сайт Roblox 
        2. Нажимаем на вкладку Profile 
        3. Листаем чуточку в низ и жмем Creations 
        4. Нажимаем на режим где создали GamePass 
        5. Нажимаем на сам GamePass 
        6. Копируем ссылку как показано на видео (если у вас Яндекс). 
        
        ⚠️ВАЖНО⚠️
        У нас есть тех поддержка, которая с радостью вам поможет если вы не поняли как все таки сделать GamePass. Мы с радостью объясним вам как это сделать.
        `, keyboard)
    }
})

bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id
    const url = msg.text;

    if (msg.text === "Вызвать меню") {
        bot.sendMessage(chatId, "Вот мое меню:", Keyboard)
    } else if (chatState[chatId] === "TRANSFER_INPUT") {
        let number = parseInt(msg.text)
        if (number === NaN) {
            await bot.sendMessage(chatId, "Введите значение в виде цифер!")
            return
        }
        db.execute("SELECT userBalance FROM users WHERE userId = ?", [userId], async (err, row) => {
            if (err) {
                console.error(err)
                return
            }
            if (!row) {
                console.log("User not found with %d", userId)
                return
            }

            if (row.userBalance - number < 0) {
                await bot.sendMessage(chatId, "У вас недостаточно баланса для покупки")
                chatState[chatId] = ""
                return
            }

            transfer_count[chatId] = number
            // db.execute( 
            //     `INSERT INTO transactions(name, url, user_id, price) VALUES (?, ?, ?, ?) RETURNING *`
            // , "vivod_sredstv",)

            chatState[chatId] = "URL_INPUT"
            await bot.sendMessage(chatId, `☁ Вы хотите приобрести ${transfer_count[chatId]} робуксов.\n🤍 Геймпасс должен стоить ${transfer_count[chatId] * 1.43}\n😊 Отправьте ссылку на геймпасс:`)
        })


    } else if (chatState[chatId] === "URL_INPUT") {
        if (!isValidHttpUrl(msg.text)) {
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Отменить покупку",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            }
            await bot.sendMessage(chatId, `❗ Ваша отправленная ссылка не рабочая, попробуйте снова!`, keyboard)
            return
        }
        console.log("Using %s URL for transaction", msg.text)
        bot.sendMessage(chatId, "❓ Вы точно хотите совершить покупку? (Да/Нет)")
        urls[chatId] = msg.text

        chatState[chatId] = "COMPLETE_WAIT_YES_OR_NO"
    } else if (chatState[chatId] === "COMPLETE_WAIT_YES_OR_NO") {
        if (msg.text.toLowerCase() == "да") {
            db.execute(`
                SELECT id, userBalance FROM users WHERE userId = ? 
            `, [msg.from.id], async (err, row) => {
                if (err) {
                    console.error(err)
                    return
                }
                if (!row) {
                    console.log("User not found with %d", userId)
                    return
                }
                await bot.sendMessage(chatId, `Ваша транзакция на обработке!`)
                db.execute(`
                    INSERT INTO transactions(name, url, user_id, price) VALUES (?, ?, ?, ?) RETURNING *; 
                `, ["Vivod_stdstv", urls[chatId], row.id, transfer_count[chatId] * 1.3], async (err, row) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    await sendURLToRabbitMq(urls[chatId], transfer_count[chatId], row.id)
                    chatState[chatId] = ""
                })
            })
        } else {
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Вернуться в меню",
                                callback_data: "backToMenu"
                            }
                        ]
                    ]
                }
            }
            bot.sendMessage(chatId, "Ваш запрос на вывод был успешно отменен.", keyboard)
            chatState[chatId] = ""
            urls[chatId] = ""
            transfer_count[chatId] = ""
        }
    } else if (chatState[chatId] === "waitMoneyAmount") {
        if (msg.text === msg.text) {
            if (msg.text > 0) {
                const number = msg.text
                Dividednumber = Math.round(number / 1.9)
                chatState[chatId] = "waitMoneyAmount"
                const keyboardPayments = {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Сбербанк", callback_data: "paySberbank"
                                }
                            ],
                            [
                                {
                                    text: "QIWI кошельек", callback_data: "payQIWI"
                                }
                            ]
                        ]
                    }
                }
                bot.sendMessage(chatId, `🤍 Вы хотите приобрести ${number} робуксов\nК оплате: ${Dividednumber} рублей\n☁ Выберите ваш метод оплаты:`, keyboardPayments).then(chatState[chatId] = "lol")
                return Dividednumber
            } else {
                bot.sendMessage(chatId, "Вы неправильно ввели сумму для платежа! Попробуйте еще раз")
            }
        }
    } else if (chatState[chatId] === "vivodMoney") {
        if (msg.text === msg.text) {
            if (msg.text > 0) {
                let number = parseInt(msg.text)
                if (number === NaN) {
                    await bot.sendMessage(chatId, "Введите значение в виде цифер!")
                    return
                }
                db.execute("SELECT userBalance FROM users WHERE userId = ?", [userId], async (err, row) => {
                    if (err) {
                        console.error(err)
                        return
                    }
                    if (!row) {
                        console.log("User not found with %d", userId)
                        return
                    }

                    if (row.userBalance - number < 0) {
                        bot.sendMessage(chatId, "😞 У вас недостаточно баланса для покупки", {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Вернуться назад",
                                            callback_data: "backToMenu"
                                        }
                                    ]
                                ]
                            }
                        })
                        chatState[chatId] = ""
                        return
                    }

                    transfer_count[chatId] = number
                    // db.execute( 
                    //     `INSERT INTO transactions(name, url, user_id, price) VALUES (?, ?, ?, ?) RETURNING *`
                    // , "vivod_sredstv",)
                    chatState[chatId] = "URL_INPUT"
                    await bot.sendMessage(chatId, `☁ Вы хотите приобрести ${transfer_count[chatId]} робуксов.\n🤍 Геймпасс должен стоить ${Math.round(transfer_count[chatId] * 1.43)}\n😊 Отправьте ссылку на геймпасс:`)
                })
            } else {
                bot.sendMessage(chatId, "Вы неправильно ввели сумму для вывода! Попробуйте еще раз")
            }
        }
    } else if (chatState[chatId] === "linkwait") {
        if (isValidHttpUrl(url)) {
            const chatId = msg.chat.id;
            const url = msg.text
            bot.sendMessage(chatId, `Бот принял вашу ссылку! Ваша заявка на вывод в очереди. Ваша ссылка -> ${url}`);
        } else {
            const chatId = msg.chat.id;
            const Keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            {
                                text: "Отменить покупку", callback_data: "otmenaPayment"
                            }
                        ]
                    ]
                }
            }
            bot.sendMessage(chatId, "Ссылка не правильная, попробуй еще раз!", Keyboard)
        }
    } else if (chatState[chatId] === "gamepassCostCalculator") {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Проверяем, является ли текст числом
        if (isNaN(text)) {
            bot.sendMessage(chatId, 'Произошла ошибка! Вам нужно ввести сумму в виде ЧИСЛА!');
            return;
        }

        // Преобразуем текст в число и вычисляем увеличенное значение
        const number = parseFloat(text);
        const increasedNumber = number * 1.43;

        bot.sendMessage(chatId, `✔️ Геймпасс должен стоить: ${increasedNumber} робуксов!`);
    } else if (chatState[chatId] === "robuxCostCalculator") {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Проверяем, является ли текст числом
        if (isNaN(text)) {
            bot.sendMessage(chatId, 'Ошибка! Введи число.');
            return;
        }

        // Преобразуем текст в число и вычисляем увеличенное значение
        const number = parseFloat(text);
        const increasedNumber = Math.round(number * 0.52631578947);

        bot.sendMessage(chatId, `✔️ Вы должны заплатить ${increasedNumber} рублей!`);
    } else if (chatState[chatId] === "robuxChanges") {
        // Проверяем, является ли текст числом
        if (msg.text === msg.text) {
            const text = msg.text
            if (isNaN(text)) {
                bot.sendMessage(chatId, 'Ошибка! Введи число.');
                return;
            }

            // Преобразуем текст в число и вычисляем увеличенное значение
            bot.sendMessage(chatId, `наличие теперь ${text} робуксов`);
            chatState[chatId] = "pon"
            return numberRobuxes = text
        }
    }
})

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const telegramUsername = msg.from.username;
    const userId = msg.from.id;
    const currentTime = new Date().toISOString();

    if (userId != "5339506080") {
        bot.sendMessage(chatId, "Приветствую тебя в моем магазине робуксов)\nНиже предоставлено мое меню. Для того, чтобы вызвать меню заново, используй клавиатуру Вызвать меню", againMenu);
        bot.sendMessage(chatId, "Вот мое меню:", Keyboard);

        db.get(`SELECT chatState FROM users WHERE userId = ?`, [userId], (err, row) => {
            if (err) {
                console.error(err.message);
                return;
            }
            let chatState = 'NormalUserState';
            if (row && row.chatState) {
                chatState = row.chatState;
            } else {
                db.execute(`INSERT INTO users (telegramUsername, userId, timeReg) VALUES (?, ?, ?)`, [telegramUsername, userId, currentTime], function (err) {
                    if (err) {
                        console.error(err.message);
                        return;
                    }
                    console.log(`User ${telegramUsername} (${userId}) inserted into the database.`);
                });
            }
        });
    } else {
        bot.sendMessage(5339506080, "Бот еще находится на разработке! Попробуйте воспользоваться мной позже.")
        bot.sendMessage(809124390, "Дима зашел в бота, срочно устраняй проблему")
    }
});

const Keyboard = {
    reply_markup: {
        inline_keyboard: [
            [
                {
                    text: "👤 Профиль 👤",
                    callback_data: "profile"
                }
            ],
            [
                {
                    text: "🛍️ Инструкция",
                    callback_data: "instruction"
                },
                {
                    text: "Наличие 🤑",
                    callback_data: "proverkaRBX"
                }
            ],
            [
                {
                    text: "💳 Купить Robux",
                    callback_data: "buyRobux"
                },
                {
                    text: "Вывести Robux 🎁",
                    callback_data: "giveaway"
                }
            ],
            [
                {
                    text: "💰 Баланс",
                    callback_data: "balance"
                },
                {
                    text: 'Калькулятор 🧮',
                    callback_data: "calculator"
                }
            ],
            [
                {
                    text: "❓ Поддержка",
                    callback_data: "helpAdmin"
                },
                {
                    text: "Новости 📢",
                    callback_data: "newsChanel"
                }
            ]
        ]
    }
}
const againMenu = {
    reply_markup: {
        keyboard: [
            [{ text: 'Вызвать меню' }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false,
    }
}

// bot.onText(/\/transfer/, async (msg) => {
//     const chatId = msg.chat.id;

//     const userid = msg.from.id;

//     db.execute(`SELECT * FROM users WHERE userId = ?;`, [userid], async (err, row) => {
//         if (err) {
//             console.error(err)
//             return
//         }
//         if (row === null || row === undefined) {
//             console.log("User with tgid %d not found", userid)
//             await bot.sendMessage(chatId, "Введите /start для начала разговора!")
//             return
//         }

//         chatState[chatId] = "TRANSFER_INPUT"

//         await bot.sendMessage(chatId, "Какое количество робуксов вы хотите вывести?")
//     })
// })

bot.onText(/\/addbalance (\d+) (\d+)/, (msg, match) => {
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
});
bot.onText(/\/minusbalance (\d+) (\d+)/, (msg, match) => {
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
});
bot.onText(/\/blockuser (\d+)/, (msg, match) => {
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
});
bot.onText(/\/addToken (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const token = match[1]; // Значение токена, переданное в команде

    // Вставка значения токена в базу данных
    db.execute('INSERT INTO user_tokens (token) VALUES (?)', [token], function (err, row) {
        if (err) {
            console.error('Ошибка при вставке значения токена:', err.message);
            bot.sendMessage(chatId, 'Произошла ошибка. Пожалуйста, попробуйте снова.');
            return;
        }

        console.log('Значение токена успешно сохранено в базе данных.');
        bot.sendMessage(chatId, 'Значение токена успешно сохранено.');
    });
});

function blockUser(userId, callback) {
    db.execute(
        `UPDATE users SET isBlocked = 1 WHERE userId = ?`,
        [userId],
        function (err) {
            if (err) {
                console.error(err.message);
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        }
    );
}

function isAdminUser(userId) {
    const adminUserIds = [809124390,];
    return adminUserIds.includes(userId);
}

function increaseUserBalance(userId, amount, callback) {
    db.execute(
        `UPDATE users SET userBalance = userBalance + ? WHERE userId = ?`,
        [amount, userId],
        function (err) {
            if (err) {
                console.error(err.message);
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        }
    );
}

function minusUserBalance(userId, amount, callback) {
    db.execute(
        `UPDATE users SET userBalance = userBalance + ? WHERE userId = ?`,
        [amount, userId],
        function (err) {
            if (err) {
                console.error(err.message);
                callback({ success: false });
            } else {
                callback({ success: true });
            }
        }
    );
}

bot.onText(/\/support/, (msg) => {
    const chatId = msg.chat.id;

    // Отправка приветственного сообщения от технической поддержки
    bot.sendMessage(chatId, 'Добро пожаловать в службу технической поддержки. Как мы можем вам помочь?');
});

function handleUserMessage(chatId, message) {
    // Здесь вы можете добавить логику обработки сообщения пользователя
    // и предоставить соответствующий ответ или рекомендации от технической поддержки.
    // Например, вы можете сохранять сообщения пользователя в базе данных для дальнейшей обработки.

    // Пример обработки сообщений пользователя
    if (message.toLowerCase().includes('проблема')) {
        d
        bot.sendMessage(chatId, 'Кажется, у вас возникла проблема. Мы постараемся помочь вам в ближайшее время.',);
    } else if (message.toLowerCase().includes('вопрос')) {
        bot.sendMessage(chatId, 'Если у вас есть вопрос, с удовольствием на него ответим.');
    } else {
    }
}

bot.on('polling_error', (error) => {
    console.log(error);
});

bot.onText(/\/lenalox/, (msg, match) => {
    const chatId = msg.chat.id;
    console.log(chatId)
});

bot.onText(/\/lenamagic/, (msg) => {
    const chatId = msg.chat.id;
    chatState[chatId] = "robuxChanges"
    bot.sendMessage(chatId, "Напиши сумму наличия ботиха")
})

bot.onText(/\/proverka/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, `Наличие: ${numberRobuxes} робуксов`)
})

