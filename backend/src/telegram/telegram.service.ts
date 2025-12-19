import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { Telegraf } from 'telegraf';
import { TelegramConfig, TelegramConfigDocument } from './telegram.schema.js';
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
            settings: config?.settings || { alertOnInactive: false, alertOnLowScore: false },
            starredCount: config?.starredNodeIds?.length || 0
        };
    }

    async updateSettings(settings: { alertOnInactive: boolean; alertOnLowScore: boolean }) {
        const config = await this.telegramConfigModel.findOne({});
        if (!config) throw new Error('No Telegram account connected');

        config.settings = { ...config.settings, ...settings };
        await config.save();
        return config.settings;
    }

    async updateStarredNodes(nodeIds: string[]) {
        const config = await this.telegramConfigModel.findOne({});
        if (!config) return; // Silent fail if not connected, frontend might sync before connect

        config.starredNodeIds = nodeIds;
        await config.save();
        this.logger.debug(`Updated starred nodes for alerts: ${nodeIds.length} nodes`);
    }

    async sendTestAlert() {
        const config = await this.telegramConfigModel.findOne({});
        if (!config) {
            throw new Error('No Telegram account connected.');
        }
        return this.sendAlert('🔔 This is a TEST alert from Xandeum Analytics!', config.chatId);
    }

    // Overload to accept optional chatId, default to stored
    async sendAlert(message: string, chatId?: string) {
        if (!this.bot) return;

        let targetChatId = chatId;
        if (!targetChatId) {
            const config = await this.telegramConfigModel.findOne({});
            if (!config) return;
            targetChatId = config.chatId;
        }

        try {
            await this.bot.telegram.sendMessage(targetChatId, message, { parse_mode: 'HTML' });
            return { success: true };
        } catch (e) {
            this.logger.error('Failed to send Telegram message', e);
            throw e; // Propagate error for manual tests
        }
    }

    /**
     * Core Alert Logic
     * Called by PnodesService every sync loop
     */
    async checkAndSendAlerts(allNodes: any[]) {
        if (!this.bot) return;

        const config = await this.telegramConfigModel.findOne({});
        if (!config || !config.starredNodeIds || config.starredNodeIds.length === 0) return;

        const { alertOnInactive, alertOnLowScore } = config.settings || { alertOnInactive: false, alertOnLowScore: false };
        if (!alertOnInactive && !alertOnLowScore) return;

        const alertState = config.alertState || new Map();
        let stateChanged = false;

        for (const nodeId of config.starredNodeIds) {
            const node = allNodes.find(n => n.node_id === nodeId);
            if (!node) continue;

            const currentState = alertState.get(nodeId) || { lastStatus: 'unknown', lastScore: 100 };

            // 1. Check Inactive
            this.logger.debug(`Checking Inactive for ${nodeId}: alertOnInactive=${alertOnInactive}, status=${node.status}, lastStatus=${currentState.lastStatus}`);
            if (alertOnInactive) {
                const currentStatus = node.status || 'unknown';
                // Trigger if status changes TO offline/degraded FROM online/unknown
                const isBad = currentStatus !== 'online';
                const wasGood = currentState.lastStatus === 'online' || currentState.lastStatus === 'unknown';

                if (isBad && wasGood) {
                    this.logger.log(`🚨 Triggering Alert for ${nodeId}: Changed from ${currentState.lastStatus} to ${currentStatus}`);
                    const msg = `⚠️ <b>Node Alert: ${nodeId.slice(0, 8)}...</b>\nStatus is now <b>${currentStatus.toUpperCase()}</b>`;
                    this.sendAlert(msg, config.chatId).catch(e => this.logger.error(e));
                }
                currentState.lastStatus = currentStatus;
            }

            // 2. Check Low Score
            if (alertOnLowScore) {
                const currentScore = node.performance_score || 0;
                const isLow = currentScore < 50;
                const wasHigh = currentState.lastScore >= 50;

                if (isLow && wasHigh) {
                    const msg = `📉 <b>Performance Alert: ${nodeId.slice(0, 8)}...</b>\nScore dropped to <b>${currentScore}</b>`;
                    this.sendAlert(msg, config.chatId).catch(e => this.logger.error(e));
                }
                currentState.lastScore = currentScore;
            }

            alertState.set(nodeId, currentState);
            stateChanged = true;
        }

        if (stateChanged) {
            config.alertState = alertState;
            config.markModified('alertState');
            await config.save();
            this.logger.debug(`Saved updated alertState for ${config.starredNodeIds.length} nodes`);
        }
    }
}
