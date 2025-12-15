import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

class EventDetails {
    @Prop({ required: true })
    message: string;

    @Prop({ type: Object })
    old_value?: any;

    @Prop({ type: Object })
    new_value?: any;

    @Prop({ type: Object })
    delta?: any;

    @Prop({ type: Object })
    metadata?: any;
}

class EventSnapshot {
    @Prop()
    node_status?: string;

    @Prop()
    node_version?: string;

    @Prop({ type: Number })
    network_health?: number;
}

@Schema({ timestamps: true })
export class Event {
    @Prop({ required: true, unique: true })
    event_id: string;

    @Prop({ required: true, type: Date, index: true })
    timestamp: Date;

    // Event Classification
    @Prop({ required: true, enum: ['node', 'storage', 'performance', 'network'], index: true })
    category: string;

    @Prop({ required: true, index: true })
    type: string;

    @Prop({ required: true, enum: ['info', 'warning', 'error', 'critical'], index: true })
    severity: string;

    // Related Entity
    @Prop({ required: true, index: true })
    node_id: string;

    // Event Details
    @Prop({ type: EventDetails, required: true })
    details: EventDetails;

    // Context
    @Prop({ type: EventSnapshot })
    snapshot?: EventSnapshot;
}

export const EventSchema = SchemaFactory.createForClass(Event);

// Create compound indexes
EventSchema.index({ timestamp: -1 });
EventSchema.index({ node_id: 1, timestamp: -1 });
EventSchema.index({ category: 1, type: 1 });
EventSchema.index({ severity: 1, timestamp: -1 });
