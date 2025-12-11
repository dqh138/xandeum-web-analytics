import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PnodesService } from './pnodes.service';
import { PnodesController } from './pnodes.controller';
import { PNode, PNodeSchema } from './schemas/pnode.schema';
import { PNodeMetric, PNodeMetricSchema } from './schemas/pnode-metric.schema';
import { NetworkSnapshot, NetworkSnapshotSchema } from './schemas/network-snapshot.schema';
import { SystemStatus, SystemStatusSchema } from './schemas/system-status.schema';
import { XandeumNetworkModule } from '../xandeum-network/xandeum-network.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PNode.name, schema: PNodeSchema },
      { name: PNodeMetric.name, schema: PNodeMetricSchema },
      { name: NetworkSnapshot.name, schema: NetworkSnapshotSchema },
      { name: SystemStatus.name, schema: SystemStatusSchema },
    ]),
    XandeumNetworkModule,
  ],
  controllers: [PnodesController],
  providers: [PnodesService],
})
export class PnodesModule {}
