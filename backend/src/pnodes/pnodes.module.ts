import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PnodesService } from './pnodes.service';
import { PnodesController } from './pnodes.controller';

// New schemas
import { Node, NodeSchema } from './schemas/node.schema';
import { MetricTimeseries, MetricTimeseriesSchema } from './schemas/metric-timeseries.schema';
import { NetworkSnapshot, NetworkSnapshotSchema } from './schemas/network-snapshot.schema';
import { Event, EventSchema } from './schemas/event.schema';
import { Provider, ProviderSchema } from './schemas/provider.schema';
import { Alert, AlertSchema } from './schemas/alert.schema';

// Keep for backward compatibility
import { SystemStatus, SystemStatusSchema } from './schemas/system-status.schema';

import { XandeumNetworkModule } from '../xandeum-network/xandeum-network.module';
import { TelegramModule } from '../telegram/telegram.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      // New collections
      { name: Node.name, schema: NodeSchema },
      { name: MetricTimeseries.name, schema: MetricTimeseriesSchema },
      { name: NetworkSnapshot.name, schema: NetworkSnapshotSchema },
      { name: Event.name, schema: EventSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: Alert.name, schema: AlertSchema },

      // Backward compatibility
      { name: SystemStatus.name, schema: SystemStatusSchema },
    ]),
    XandeumNetworkModule,
    TelegramModule,
  ],
  controllers: [PnodesController],
  providers: [PnodesService],
})
export class PnodesModule { }

