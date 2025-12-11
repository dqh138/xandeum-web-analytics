import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NetworkSnapshotDocument = NetworkSnapshot & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false }, timeseries: { timeField: 'createdAt', granularity: 'minutes' } })
export class NetworkSnapshot {
  @Prop({ type: Number })
  total_nodes: number;

  @Prop({ type: Number })
  active_nodes: number;

  @Prop({ type: Number })
  total_storage_committed: number;

  @Prop({ type: Number })
  total_storage_used: number;

  // Store version distribution as an array of objects to handle version strings with dots
  @Prop({ type: [{ version: String, count: Number }], _id: false })
  version_distribution: { version: string; count: number }[];
}

export const NetworkSnapshotSchema = SchemaFactory.createForClass(NetworkSnapshot);
