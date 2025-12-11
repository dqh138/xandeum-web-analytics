import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemStatusDocument = SystemStatus & Document;

@Schema({ timestamps: true })
export class SystemStatus {
  @Prop({ required: true, unique: true, default: 'main_status' })
  id: string; // Singleton ID

  @Prop({ type: Date })
  last_sync_timestamp: Date;

  @Prop({ enum: ['success', 'error', 'syncing'], default: 'success' })
  sync_status: string;

  @Prop()
  last_error_message: string;

  @Prop({ type: Number, default: 0 })
  consecutive_failures: number;
}

export const SystemStatusSchema = SchemaFactory.createForClass(SystemStatus);
