import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProviderDocument = Provider & Document;

class Identification {
    @Prop({ type: [String] })
    ip_ranges: string[];

    @Prop({ type: Number })
    asn?: number;

    @Prop()
    organization?: string;
}

class ProviderNodes {
    @Prop({ type: [String] })
    node_ids: string[];

    @Prop({ type: Number, default: 0 })
    total_count: number;

    @Prop({ type: Number, default: 0 })
    active_count: number;
}

class ProviderMetrics {
    @Prop({ type: Number, default: 0 })
    total_storage_committed: number;

    @Prop({ type: Number, default: 0 })
    total_storage_used: number;

    @Prop({ type: Number, default: 0 })
    average_uptime_hours: number;

    @Prop({ type: Number, default: 0 })
    average_cpu_percent: number;

    @Prop({ type: Number, default: 0 })
    average_ram_usage_percent: number;

    @Prop({ type: Number, default: 0 })
    total_throughput_gbps: number;
}

class Rankings {
    @Prop({ type: Number })
    storage_rank?: number;

    @Prop({ type: Number })
    reliability_rank?: number;

    @Prop({ type: Number })
    performance_rank?: number;
}

class ProviderGeo {
    @Prop()
    primary_country?: string;

    @Prop({ type: [String] })
    countries: string[];
}

@Schema({ timestamps: true })
export class Provider {
    @Prop({ required: true, unique: true, index: true })
    provider_id: string;

    @Prop({ required: true })
    provider_name: string;

    @Prop({ type: Identification })
    identification: Identification;

    @Prop({ type: ProviderNodes, default: {} })
    nodes: ProviderNodes;

    @Prop({ type: ProviderMetrics, default: {} })
    metrics: ProviderMetrics;

    @Prop({ type: Rankings })
    rankings?: Rankings;

    @Prop({ type: ProviderGeo })
    geo?: ProviderGeo;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);

// Create indexes
ProviderSchema.index({ 'metrics.total_storage_committed': -1 });
ProviderSchema.index({ 'rankings.storage_rank': 1 });
