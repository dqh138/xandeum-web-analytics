import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type AlertDocument = Alert & Document;

class AlertRule {
    @Prop({ required: true })
    name: string;

    @Prop()
    description?: string;

    @Prop({ type: Boolean, default: true })
    enabled: boolean;

    @Prop({ required: true })
    metric: string;

    @Prop({ required: true, enum: ['>', '<', '=', '>=', '<=', '!='] })
    operator: string;

    @Prop({ required: true, type: Number })
    threshold: number;

    @Prop({ type: Number, default: 5 })
    duration_minutes: number;

    @Prop({ required: true, enum: ['node', 'network', 'provider'] })
    scope: string;

    @Prop({ type: [String] })
    target_ids: string[];
}

class AlertState {
    @Prop({ required: true, enum: ['active', 'resolved', 'acknowledged'], index: true })
    status: string;

    @Prop({ type: Date, index: true })
    triggered_at?: Date;

    @Prop({ type: Date })
    resolved_at?: Date;

    @Prop({ type: Date })
    acknowledged_at?: Date;

    @Prop()
    acknowledged_by?: string;
}

class AlertData {
    @Prop({ type: Number })
    current_value?: number;

    @Prop({ type: Number })
    threshold_value?: number;

    @Prop({ enum: ['warning', 'critical'] })
    severity?: string;

    @Prop({ type: [String] })
    affected_entities: string[];
}

@Schema({ timestamps: true })
export class Alert {
    @Prop({ required: true, unique: true })
    alert_id: string;

    @Prop({ type: AlertRule, required: true })
    rule: AlertRule;

    @Prop({ type: AlertState, required: true })
    state: AlertState;

    @Prop({ type: AlertData })
    data?: AlertData;
}

export const AlertSchema = SchemaFactory.createForClass(Alert);

// Create indexes
AlertSchema.index({ 'state.status': 1 });
AlertSchema.index({ 'state.triggered_at': -1 });
AlertSchema.index({ 'rule.metric': 1 });
