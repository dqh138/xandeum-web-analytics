import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramController } from './telegram.controller';
import { TelegramService } from './telegram.service';
import { TelegramConfig, TelegramConfigSchema } from './telegram.schema';

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
