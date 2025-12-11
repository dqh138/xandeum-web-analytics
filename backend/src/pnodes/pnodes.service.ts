import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PNode, PNodeDocument } from './schemas/pnode.schema';
import { PNodeMetric, PNodeMetricDocument } from './schemas/pnode-metric.schema';
import { NetworkSnapshot, NetworkSnapshotDocument } from './schemas/network-snapshot.schema';
import { SystemStatus, SystemStatusDocument } from './schemas/system-status.schema';
import { CreatePNodeDto } from './dto/create-pnode.dto';
import { XandeumNetworkService } from '../xandeum-network/xandeum-network.service';

@Injectable()
export class PnodesService implements OnModuleInit {
  private readonly logger = new Logger(PnodesService.name);

  constructor(
    @InjectModel(PNode.name) private pnodeModel: Model<PNodeDocument>,
    @InjectModel(PNodeMetric.name) private pnodeMetricModel: Model<PNodeMetricDocument>,
    @InjectModel(NetworkSnapshot.name) private networkSnapshotModel: Model<NetworkSnapshotDocument>,
    @InjectModel(SystemStatus.name) private systemStatusModel: Model<SystemStatusDocument>,
    private readonly xandeumNetworkService: XandeumNetworkService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing PnodesService. Running initial sync...');
    // Initialize system status if not exists
    await this.systemStatusModel.updateOne(
      { id: 'main_status' },
      { $setOnInsert: { id: 'main_status', sync_status: 'success', consecutive_failures: 0 } },
      { upsert: true }
    );
    
    // Run initial sync slightly delayed to ensure connection is ready
    setTimeout(() => this.syncNodes(), 5000);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running automatic node sync cron job...');
    await this.syncNodes();
  }

  async create(createPNodeDto: CreatePNodeDto): Promise<PNode> {
    const createdPNode = new this.pnodeModel(createPNodeDto);
    return createdPNode.save();
  }

  async findAll(): Promise<PNode[]> {
    return this.pnodeModel.find().exec();
  }

  async findOne(nodeId: string): Promise<PNode | null> {
    return this.pnodeModel.findOne({ nodeId }).exec();
  }

  async syncNodes(): Promise<string> {
    // 1. Mark as syncing
    await this.systemStatusModel.updateOne({ id: 'main_status' }, { sync_status: 'syncing' });

    try {
      const blockchainNodes = await this.xandeumNetworkService.getProviderNodes();
      
      // Check for empty result which indicates failure (since we have retries in service now)
      if (blockchainNodes.length === 0) {
        throw new Error('No nodes fetched from RPC (Possible Network Error)');
      }

      let count = 0;
      
      // Stats for NetworkSnapshot
      let totalStorageCommitted = 0;
      let totalStorageUsed = 0;
      let activeNodes = 0;
      const versionDistribution = new Map<string, number>();

      for (const node of blockchainNodes) {
        // 1. Update Static/Current State in PNode
        await this.pnodeModel.findOneAndUpdate(
          { nodeId: node.nodeId },
          { 
            ...node, 
            last_metric_timestamp: new Date() 
          },
          { upsert: true, new: true }
        );

        // 2. Insert into Time-Series (PNodeMetric)
        // Note: Some fields might need to be extracted or parsed depending on what `node` object actually contains
        await this.pnodeMetricModel.create({
          nodeId: node.nodeId,
          status: node.status,
          latency: 0, // Placeholder, XandeumNetworkService doesn't provide this yet
          storage_usage_percent: node.storage_usage_percent || 0,
          storage_used: node.storage_used || 0,
          storage_committed: node.storage_committed || 0,
          uptime: node.uptime || 0,
        });

        // Aggregate Stats
        if (node.status === 'online') activeNodes++;
        totalStorageCommitted += (node.storage_committed || 0);
        totalStorageUsed += (node.storage_used || 0);
        
        const v = node.version || 'unknown';
        versionDistribution.set(v, (versionDistribution.get(v) || 0) + 1);

        count++;
      }

      // 3. Create Network Snapshot
      if (count > 0) {
        const versionArray = Array.from(versionDistribution, ([version, count]) => ({ version, count }));

        await this.networkSnapshotModel.create({
          total_nodes: count,
          active_nodes: activeNodes,
          total_storage_committed: totalStorageCommitted,
          total_storage_used: totalStorageUsed,
          version_distribution: versionArray,
        });
        this.logger.log(`Created network snapshot for ${count} nodes.`);
      }

      // 4. Mark as SUCCESS
      await this.systemStatusModel.updateOne(
        { id: 'main_status' },
        { 
          sync_status: 'success', 
          last_sync_timestamp: new Date(), 
          consecutive_failures: 0,
          last_error_message: null
        }
      );

      return `Synced ${count} nodes from blockchain.`;

    } catch (error) {
      // 5. Mark as ERROR
      this.logger.error(`Sync failed: ${error.message}`);
      await this.systemStatusModel.updateOne(
        { id: 'main_status' },
        { 
          sync_status: 'error', 
          last_sync_timestamp: new Date(),
          $inc: { consecutive_failures: 1 },
          last_error_message: error.message
        }
      );
      return `Sync Failed: ${error.message}`;
    }
  }

  async getSystemStatus(): Promise<SystemStatus | null> {
    return this.systemStatusModel.findOne({ id: 'main_status' }).exec();
  }

  // --- Analytics Methods ---

  async getNetworkStatsHistory(limit: number = 24): Promise<NetworkSnapshot[]> {
    // Return last X snapshots
    return this.networkSnapshotModel.find().sort({ createdAt: -1 }).limit(limit).exec();
  }

  async getNodeMetricsHistory(nodeId: string, limit: number = 24): Promise<PNodeMetric[]> {
    return this.pnodeMetricModel.find({ nodeId }).sort({ createdAt: -1 }).limit(limit).exec();
  }
}
