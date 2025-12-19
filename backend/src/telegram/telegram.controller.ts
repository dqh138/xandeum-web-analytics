import { Controller, Get, Post, Put, Body } from '@nestjs/common';
import { TelegramService } from './telegram.service.js';

@Controller('telegram')
export class TelegramController {
    constructor(private readonly telegramService: TelegramService) { }

    @Get('auth-link')
    async getAuthLink() {
        return this.telegramService.getAuthLink();
    }

    @Get('status')
    async getStatus() {
        return this.telegramService.getStatus();
    }

    @Post('test')
    async sendTestAlert() {
        return this.telegramService.sendTestAlert();
    }

    @Put('settings')
    async updateSettings(@Body() settings: { alertOnInactive: boolean; alertOnLowScore: boolean }) {
        return this.telegramService.updateSettings(settings);
    }

    @Put('starred')
    async updateStarredNodes(@Body() body: { nodeIds: string[] }) {
        return this.telegramService.updateStarredNodes(body.nodeIds);
    }
}
