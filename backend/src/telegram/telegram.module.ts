import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramController } from './telegram.controller.js';
import { TelegramService } from './telegram.service.js';
import { TelegramConfig, TelegramConfigSchema } from './telegram.schema.js';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: TelegramConfig.name, schema: TelegramConfigSchema },
        ]),
    ],
    controllers: [TelegramController],
    providers: [TelegramService],
    exports: [TelegramService],
})
export class TelegramModule { }
