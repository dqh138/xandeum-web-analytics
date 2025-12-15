import { Controller, Get, Post, Param, NotFoundException, Query } from '@nestjs/common';
import { PnodesService } from './pnodes.service';

// New schemas
import { Node } from './schemas/node.schema';
import { MetricTimeseries } from './schemas/metric-timeseries.schema';
import { NetworkSnapshot } from './schemas/network-snapshot.schema';
import { Event } from './schemas/event.schema';
import { Provider } from './schemas/provider.schema';
import { SystemStatus } from './schemas/system-status.schema';

@Controller('pnodes')
export class PnodesController {
  constructor(private readonly pnodesService: PnodesService) { }

  @Post()
  async syncNodes(): Promise<string> {
    return this.pnodesService.syncNodes();
  }

  @Get('system-status')
  async getSystemStatus(): Promise<SystemStatus | null> {
    return this.pnodesService.getSystemStatus();
  }

  @Get('events')
  async getEvents(@Query('limit') limit: number): Promise<Event[]> {
    return this.pnodesService.getEvents(limit || 100);
  }

  @Get('providers')
  async getProviders(): Promise<Provider[]> {
    return this.pnodesService.getProviders();
  }

  @Get()
  async findAll(): Promise<Node[]> {
    return this.pnodesService.findAll();
  }

  @Get('stats/history')
  async getNetworkHistory(@Query('limit') limit: number): Promise<NetworkSnapshot[]> {
    return this.pnodesService.getNetworkStatsHistory(limit || 24);
  }

  @Get(':nodeId')
  async findOne(@Param('nodeId') nodeId: string): Promise<Node> {
    const node = await this.pnodesService.findOne(nodeId);
    if (!node) {
      throw new NotFoundException(`Node with ID ${nodeId} not found`);
    }
    return node;
  }

  @Get(':nodeId/history')
  async getNodeHistory(@Param('nodeId') nodeId: string, @Query('limit') limit: number): Promise<MetricTimeseries[]> {
    return this.pnodesService.getNodeMetricsHistory(nodeId, limit || 24);
  }
}
