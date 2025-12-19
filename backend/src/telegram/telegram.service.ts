import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Telegraf } from 'telegraf';
import { TelegramConfig, TelegramConfigDocument } from './telegram.schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TelegramService implements OnModuleInit {
    private bot: Telegraf;
    private readonly logger = new Logger(TelegramService.name);
    private readonly BOT_TOKEN: string;
    private botUsername = '';

    constructor(
        @InjectModel(TelegramConfig.name)
        private telegramConfigModel: Model<TelegramConfigDocument>,
        private configService: ConfigService,
    ) {
        this.BOT_TOKEN = this.configService.get<string>('TELEGRAM_BOT_TOKEN') || 'YOUR_BOT_TOKEN_HERE';
        if (this.BOT_TOKEN !== 'YOUR_BOT_TOKEN_HERE') {
            this.bot = new Telegraf(this.BOT_TOKEN);
        }
    }

    async onModuleInit() {
        if (!this.bot) {
            this.logger.warn('Telegram Bot Token not set. Telegram features will be disabled.');
            return;
        }

        try {
            const botInfo = await this.bot.telegram.getMe();
            this.botUsername = botInfo.username;
            this.logger.log(`Telegram Bot initialized: @${this.botUsername}`);

            this.bot.start(async (ctx) => {
                const startPayload = ctx.payload; // param from deep link
                this.logger.log(`Received start command with payload: ${startPayload}`);

                // We can strictly validate the payload if we want to link to a specific web session
                // For now, we just save the chat ID as the "connected" user

                const chatId = ctx.chat.id.toString();
                const username = ctx.from.username;

                await this.telegramConfigModel.deleteMany({}); // Only one user supported for this demo
                await this.telegramConfigModel.create({
                    chatId,
                    username,
                });

                ctx.reply('Success! Your Telegram account is now connected to Xandeum Analytics.');
            });

            this.bot.launch();
        } catch (e) {
            this.logger.error('Failed to launch Telegram bot', e);
        }
    }

    async getAuthLink() {
        if (!this.bot || !this.botUsername) {
            return { url: '', error: 'Bot not configured' };
        }
        const uniqueCode = uuidv4();
        // Deep link format: https://t.me/bot_username?start=unique_code
        const url = `https://t.me/${this.botUsername}?start=${uniqueCode}`;
        return { url };
    }

    async getStatus() {
        const config = await this.telegramConfigModel.findOne({});
        return {
            connected: !!config,
            username: config?.username,
        };
    }

    async sendTestAlert() {
        const config = await this.telegramConfigModel.findOne({});
        if (!config) {
            throw new Error('No Telegram account connected.');
        }
        return this.sendAlert('🔔 This is a TEST alert from Xandeum Analytics!');
    }

    async sendAlert(message: string) {
        if (!this.bot) return;
        const config = await this.telegramConfigModel.findOne({});
        if (!config) {
            this.logger.warn('Cannot send alert. No Telegram connected.');
            return;
        }
        try {
            await this.bot.telegram.sendMessage(config.chatId, message);
            return { success: true };
        } catch (e) {
            this.logger.error('Failed to send Telegram message', e);
            throw e;
        }
    }
}
