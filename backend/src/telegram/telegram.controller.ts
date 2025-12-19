import { Controller, Get, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';

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
}
