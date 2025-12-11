import { Controller, Get, Post, Body, Param, NotFoundException, Query } from '@nestjs/common';
import { PnodesService } from './pnodes.service';
import { CreatePNodeDto } from './dto/create-pnode.dto';
import { PNode } from './schemas/pnode.schema';
import { PNodeMetric } from './schemas/pnode-metric.schema';
import { NetworkSnapshot } from './schemas/network-snapshot.schema';
import { SystemStatus } from './schemas/system-status.schema';

@Controller('pnodes')
export class PnodesController {
  constructor(private readonly pnodesService: PnodesService) {}

  @Post()
  async create(@Body() createPNodeDto: CreatePNodeDto): Promise<PNode> {
    return this.pnodesService.create(createPNodeDto);
  }

  @Get('system-status')
  async getSystemStatus(): Promise<SystemStatus | null> {
    return this.pnodesService.getSystemStatus();
  }

  @Get()
  async findAll(): Promise<PNode[]> {
    return this.pnodesService.findAll();
  }

  @Get('stats/history')
  async getNetworkHistory(@Query('limit') limit: number): Promise<NetworkSnapshot[]> {
    return this.pnodesService.getNetworkStatsHistory(limit || 24);
  }

  @Get(':nodeId')
  async findOne(@Param('nodeId') nodeId: string): Promise<PNode> {
    const node = await this.pnodesService.findOne(nodeId);
    if (!node) {
      throw new NotFoundException(`PNode with ID ${nodeId} not found`);
    }
    return node;
  }

  @Get(':nodeId/history')
  async getNodeHistory(@Param('nodeId') nodeId: string, @Query('limit') limit: number): Promise<PNodeMetric[]> {
    return this.pnodesService.getNodeMetricsHistory(nodeId, limit || 24);
  }
}
