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

    @Prop({ type: [String], default: [] })
    starredNodeIds: string[];

    @Prop({ type: Object, default: { alertOnInactive: false, alertOnLowScore: false } })
    settings: {
        alertOnInactive: boolean;
        alertOnLowScore: boolean;
    };

    // Tracks the last checking state to prevent spamming
    // Map<NodeID, { lastStatus: string, lastScore: number }>
    @Prop({ type: Map, of: Object, default: {} })
    alertState: Map<string, { lastStatus: string; lastScore: number }>;
}

export const TelegramConfigSchema = SchemaFactory.createForClass(TelegramConfig);
