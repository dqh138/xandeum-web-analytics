import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PNodeDocument = PNode & Document;

@Schema()
export class PNode {
  @Prop({ required: true, unique: true })
  nodeId: string; // Mapped from 'pubkey'

  @Prop({ required: true })
  address: string;

  @Prop({ type: Number })
  latitude?: number;

  @Prop({ type: Number })
  longitude?: number;

  @Prop({ enum: ['online', 'offline', 'degraded'], default: 'offline' })
  status: string;

  @Prop({ type: Boolean })
  is_public: boolean;

  @Prop({ type: Number })
  last_seen_timestamp: number;

  @Prop({ type: Number })
  rpc_port: number;

  @Prop({ type: Number })
  storage_committed: number;

  @Prop({ type: Number })
  storage_usage_percent: number;

  @Prop({ type: Number })
  storage_used: number;

  @Prop({ type: Number })
  uptime: number;

  @Prop()
  version: string;

  @Prop({ default: Date.now })
  registeredAt: Date;

  @Prop({ type: Date })
  last_metric_timestamp: Date;
}

export const PNodeSchema = SchemaFactory.createForClass(PNode);
