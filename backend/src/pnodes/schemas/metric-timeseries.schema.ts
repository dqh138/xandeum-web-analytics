import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetricTimeseriesDocument = MetricTimeseries & Document;

// Sub-schemas for organized metrics
class StorageMetrics {
    @Prop({ type: Number, default: 0 })
    committed: number;

    @Prop({ type: Number, default: 0 })
    used: number;

    @Prop({ type: Number, default: 0 })
    available: number;

    @Prop({ type: Number, default: 0 })
    usage_percent: number;
}

class SystemMetrics {
    @Prop({ type: Number, default: 0 })
    uptime_seconds: number;

    @Prop({ type: Number })
    cpu_percent?: number;

    @Prop({ type: Number })
    ram_total?: number;

    @Prop({ type: Number })
    ram_used?: number;

    @Prop({ type: Number })
    ram_usage_percent?: number;
}

class NetworkMetrics {
    @Prop({ type: Number })
    active_streams?: number;

    @Prop({ type: Number })
    packets_sent?: number;

    @Prop({ type: Number })
    packets_received?: number;

    @Prop({ type: Number })
    packets_sent_delta?: number;

    @Prop({ type: Number })
    packets_received_delta?: number;

    @Prop({ type: Number })
    total_bytes?: number;

    @Prop({ type: Number })
    throughput_bps?: number;
}

class StorageDetails {
    @Prop({ type: Number })
    total_pages?: number;

    @Prop({ type: Number })
    current_index?: number;

    @Prop({ type: Number })
    file_size?: number;
}

class PerformanceMetrics {
    @Prop({ type: Number })
    latency_ms?: number;

    @Prop({ type: Number })
    response_time_ms?: number;
}

@Schema({
    timeseries: {
        timeField: 'timestamp',
        metaField: 'node_id',
        granularity: 'minutes'
    },
    expireAfterSeconds: 2592000 // 30 days retention
})
export class MetricTimeseries {
    @Prop({ required: true, index: true })
    node_id: string;

    @Prop({ required: true, type: Date })
    timestamp: Date;

    @Prop({ type: StorageMetrics, default: {} })
    storage: StorageMetrics;

    @Prop({ type: SystemMetrics, default: {} })
    system: SystemMetrics;

    @Prop({ type: NetworkMetrics, default: {} })
    network: NetworkMetrics;

    @Prop({ type: StorageDetails })
    storage_details?: StorageDetails;

    @Prop({ type: PerformanceMetrics })
    performance?: PerformanceMetrics;

    @Prop()
    status: string;
}

export const MetricTimeseriesSchema = SchemaFactory.createForClass(MetricTimeseries);

// Create compound index for efficient queries
MetricTimeseriesSchema.index({ node_id: 1, timestamp: -1 });
