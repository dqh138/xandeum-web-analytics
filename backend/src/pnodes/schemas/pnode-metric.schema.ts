import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PNodeMetricDocument = PNodeMetric & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, timeseries: { timeField: 'createdAt', metaField: 'nodeId', granularity: 'minutes' } })
export class PNodeMetric {
  @Prop({ required: true, index: true })
  nodeId: string;

  @Prop()
  status: string;

  @Prop({ type: Number })
  latency: number; // in ms

  @Prop({ type: Number })
  storage_usage_percent: number;

  @Prop({ type: Number })
  storage_used: number;

  @Prop({ type: Number })
  storage_committed: number;

  @Prop({ type: Number })
  uptime: number;
}

export const PNodeMetricSchema = SchemaFactory.createForClass(PNodeMetric);
