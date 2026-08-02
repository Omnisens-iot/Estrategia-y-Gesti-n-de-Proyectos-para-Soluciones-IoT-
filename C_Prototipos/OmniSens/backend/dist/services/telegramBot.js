"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTelegramAlert = void 0;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const token = process.env.TELEGRAM_BOT_TOKEN || '';
let bot = null;
if (token) {
    bot = new node_telegram_bot_api_1.default(token, { polling: true });
    // Test command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot?.sendMessage(chatId, `Bienvenido a OmniSens Bot! Tu Chat ID es: ${chatId}\n\nIngresa este Chat ID en la plataforma para recibir alertas sobre tus dispositivos.`);
    });
}
else {
    console.warn('TELEGRAM_BOT_TOKEN no configurado en .env. Las notificaciones estarán desactivadas.');
}
const sendTelegramAlert = async (chatId, message) => {
    if (!bot) {
        console.warn('Bot de Telegram no inicializado.');
        return;
    }
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
    catch (error) {
        console.error(`Error enviando mensaje a Telegram (chatId: ${chatId}):`, error);
    }
};
exports.sendTelegramAlert = sendTelegramAlert;
