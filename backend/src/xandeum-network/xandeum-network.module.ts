import { Module } from '@nestjs/common';
import { XandeumNetworkService } from './xandeum-network.service';
import { XandeumNetworkController } from './xandeum-network.controller';

@Module({
  controllers: [XandeumNetworkController],
  providers: [XandeumNetworkService],
  exports: [XandeumNetworkService],
})
export class XandeumNetworkModule { }
