import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NetworkSnapshotDocument = NetworkSnapshot & Document;

// Sub-schemas
class NodeStats {
  @Prop({ type: Number, default: 0 })
  total: number;

  @Prop({ type: Number, default: 0 })
  online: number;

  @Prop({ type: Number, default: 0 })
  offline: number;

  @Prop({ type: Number, default: 0 })
  degraded: number;

  @Prop({ type: Number, default: 0 })
  idle: number; // < 20% usage

  @Prop({ type: Number, default: 0 })
  moderate: number; // 20-80% usage

  @Prop({ type: Number, default: 0 })
  full: number; // > 80% usage

  @Prop({ type: Number, default: 0 })
  small: number; // < 100GB

  @Prop({ type: Number, default: 0 })
  medium: number; // 100GB - 1TB

  @Prop({ type: Number, default: 0 })
  large: number; // 1TB - 10TB

  @Prop({ type: Number, default: 0 })
  xlarge: number; // > 10TB
}

class StorageAggregates {
  @Prop({ type: Number, default: 0 })
  total_committed: number;

  @Prop({ type: Number, default: 0 })
  total_used: number;

  @Prop({ type: Number, default: 0 })
  total_available: number;

  @Prop({ type: Number, default: 0 })
  average_usage_percent: number;

  @Prop({ type: Number, default: 0 })
  median_usage_percent: number;

  @Prop({ type: Number, default: 0 })
  p95_usage_percent: number;

  @Prop({ type: Number, default: 0 })
  committed_growth_24h: number;

  @Prop({ type: Number, default: 0 })
  used_growth_24h: number;
}

class SystemAggregates {
  @Prop({ type: Number, default: 0 })
  average_cpu_percent: number;

  @Prop({ type: Number, default: 0 })
  median_cpu_percent: number;

  @Prop({ type: Number, default: 0 })
  p95_cpu_percent: number;

  @Prop({ type: Number, default: 0 })
  average_ram_usage_percent: number;

  @Prop({ type: Number, default: 0 })
  median_ram_usage_percent: number;

  @Prop({ type: Number, default: 0 })
  average_uptime_hours: number;

  @Prop({ type: Number, default: 0 })
  median_uptime_hours: number;
}

class NetworkAggregates {
  @Prop({ type: Number, default: 0 })
  total_active_streams: number;

  @Prop({ type: Number, default: 0 })
  total_packets_sent: number;

  @Prop({ type: Number, default: 0 })
  total_packets_received: number;

  @Prop({ type: Number, default: 0 })
  total_throughput_gbps: number;

  @Prop({ type: Number, default: 0 })
  average_latency_ms: number;

  @Prop({ type: Number, default: 0 })
  median_latency_ms: number;
}

class Distributions {
  @Prop({ type: [{ version: String, count: Number, percent: Number }], _id: false })
  by_version: { version: string; count: number; percent: number }[];

  @Prop({ type: [{ country: String, count: Number, storage_tb: Number }], _id: false })
  by_country?: { country: string; count: number; storage_tb: number }[];

  @Prop({ type: [{ range: String, count: Number }], _id: false })
  by_storage_size: { range: string; count: number }[];
}

class Health {
  @Prop({ type: Number, default: 0 })
  score: number; // 0-100

  @Prop({ type: Number, default: 0 })
  availability_percent: number;

  @Prop({ type: Number, default: 0 })
  reliability_score: number;

  @Prop({ type: Number, default: 0 })
  performance_score: number;
}

@Schema({
  timeseries: {
    timeField: 'timestamp',
    granularity: 'minutes'
  },
  expireAfterSeconds: 7776000 // 90 days retention
})
export class NetworkSnapshot {
  @Prop({ required: true, type: Date, index: true })
  timestamp: Date;

  @Prop({ type: NodeStats, default: {} })
  nodes: NodeStats;

  @Prop({ type: StorageAggregates, default: {} })
  storage: StorageAggregates;

  @Prop({ type: SystemAggregates, default: {} })
  system: SystemAggregates;

  @Prop({ type: NetworkAggregates, default: {} })
  network: NetworkAggregates;

  @Prop({ type: Distributions, default: {} })
  distributions: Distributions;

  @Prop({ type: Health, default: {} })
  health: Health;
}

export const NetworkSnapshotSchema = SchemaFactory.createForClass(NetworkSnapshot);
