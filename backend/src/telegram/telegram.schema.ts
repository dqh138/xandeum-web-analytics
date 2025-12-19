import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TelegramConfigDocument = HydratedDocument<TelegramConfig>;

@Schema()
export class TelegramConfig {
    @Prop({ required: true })
    chatId: string;

    @Prop()
    username: string;

    @Prop({ default: Date.now })
    connectedAt: Date;
}

export const TelegramConfigSchema = SchemaFactory.createForClass(TelegramConfig);
