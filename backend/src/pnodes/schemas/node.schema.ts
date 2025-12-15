import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NodeDocument = Node & Document;

// Sub-schema for current metrics
class CurrentMetrics {
    // Storage
    @Prop({ type: Number, default: 0 })
    storage_committed: number;

    @Prop({ type: Number, default: 0 })
    storage_used: number;

    @Prop({ type: Number, default: 0 })
    storage_available: number;

    @Prop({ type: Number, default: 0 })
    storage_usage_percent: number;

    // System
    @Prop({ type: Number, default: 0 })
    uptime_seconds: number;

    @Prop({ type: Number })
    cpu_percent?: number;

    @Prop({ type: Number })
    ram_total?: number;

    @Prop({ type: Number })
    ram_used?: number;

    @Prop({ type: Number })
    ram_available?: number;

    @Prop({ type: Number })
    ram_usage_percent?: number;

    // Network
    @Prop({ type: Number })
    active_streams?: number;

    @Prop({ type: Number })
    packets_sent?: number;

    @Prop({ type: Number })
    packets_received?: number;

    @Prop({ type: Number })
    total_bytes?: number;

    // Storage Details
    @Prop({ type: Number })
    total_pages?: number;

    @Prop({ type: Number })
    current_index?: number;

    @Prop({ type: Number })
    file_size?: number;

    // Performance
    @Prop({ type: Number })
    latency_ms?: number;

    @Prop({ type: Date })
    last_updated_at?: Date;
}

// Sub-schema for geographic data
class Geo {
    @Prop()
    country?: string;

    @Prop()
    city?: string;

    @Prop({ type: Number })
    latitude?: number;

    @Prop({ type: Number })
    longitude?: number;
}

@Schema({ timestamps: true })
export class Node {
    // Identity
    @Prop({ required: true, unique: true, index: true })
    node_id: string;

    @Prop({ required: true })
    address: string;

    @Prop()
    ip_address: string;

    @Prop({ type: Number })
    port: number;

    @Prop({ type: Boolean, default: false })
    is_public: boolean;

    @Prop({ type: Number, default: 6000 })
    rpc_port: number;

    // Status
    @Prop({ enum: ['online', 'offline', 'degraded'], default: 'offline', index: true })
    status: string;

    @Prop({ type: Date })
    first_seen_at: Date;

    @Prop({ type: Date, index: true })
    last_seen_at: Date;

    // Software
    @Prop({ index: true })
    version: string;

    @Prop({ type: Number })
    version_major?: number;

    @Prop({ type: Number })
    version_minor?: number;

    // Current Metrics (Latest Snapshot)
    @Prop({ type: CurrentMetrics, default: {} })
    current_metrics: CurrentMetrics;

    // Geographic
    @Prop({ type: Geo })
    geo?: Geo;
}

export const NodeSchema = SchemaFactory.createForClass(Node);

// Create indexes
NodeSchema.index({ status: 1 });
NodeSchema.index({ version: 1 });
NodeSchema.index({ 'geo.country': 1 });
NodeSchema.index({ last_seen_at: -1 });
