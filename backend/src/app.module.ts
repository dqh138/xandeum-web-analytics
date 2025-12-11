import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PnodesModule } from './pnodes/pnodes.module';
import { XandeumNetworkModule } from './xandeum-network/xandeum-network.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/xandeum-analytics'),
    ScheduleModule.forRoot(),
    PnodesModule,
    XandeumNetworkModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
