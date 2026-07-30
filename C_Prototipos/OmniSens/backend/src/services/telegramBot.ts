import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN || '';
let bot: TelegramBot | null = null;

if (token) {
    bot = new TelegramBot(token, { polling: true });
    
    // Test command
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        bot?.sendMessage(chatId, `Bienvenido a OmniSens Bot! Tu Chat ID es: ${chatId}\n\nIngresa este Chat ID en la plataforma para recibir alertas sobre tus dispositivos.`);
    });
} else {
    console.warn('TELEGRAM_BOT_TOKEN no configurado en .env. Las notificaciones estarán desactivadas.');
}

export const sendTelegramAlert = async (chatId: string, message: string) => {
    if (!bot) {
        console.warn('Bot de Telegram no inicializado.');
        return;
    }
    try {
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error(`Error enviando mensaje a Telegram (chatId: ${chatId}):`, error);
    }
};
