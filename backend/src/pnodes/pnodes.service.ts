import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';

// New schemas
import { Node, NodeDocument } from './schemas/node.schema';
import { MetricTimeseries, MetricTimeseriesDocument } from './schemas/metric-timeseries.schema';
import { NetworkSnapshot, NetworkSnapshotDocument } from './schemas/network-snapshot.schema';
import { Event, EventDocument } from './schemas/event.schema';
import { Provider, ProviderDocument } from './schemas/provider.schema';
import { Alert, AlertDocument } from './schemas/alert.schema';

// Backward compatibility
import { SystemStatus, SystemStatusDocument } from './schemas/system-status.schema';

import { XandeumNetworkService } from '../xandeum-network/xandeum-network.service';

@Injectable()
export class PnodesService implements OnModuleInit {
  private readonly logger = new Logger(PnodesService.name);
  private previousNodesState: Map<string, any> = new Map();

  constructor(
    @InjectModel(Node.name) private nodeModel: Model<NodeDocument>,
    @InjectModel(MetricTimeseries.name) private metricTimeseriesModel: Model<MetricTimeseriesDocument>,
    @InjectModel(NetworkSnapshot.name) private networkSnapshotModel: Model<NetworkSnapshotDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(Provider.name) private providerModel: Model<ProviderDocument>,
    @InjectModel(Alert.name) private alertModel: Model<AlertDocument>,
    @InjectModel(SystemStatus.name) private systemStatusModel: Model<SystemStatusDocument>,
    private readonly xandeumNetworkService: XandeumNetworkService,
  ) { }

  async onModuleInit() {
    this.logger.log('Initializing PnodesService with new schema...');

    // Initialize system status
    await this.systemStatusModel.updateOne(
      { id: 'main_status' },
      { $setOnInsert: { id: 'main_status', sync_status: 'success', consecutive_failures: 0 } },
      { upsert: true }
    );

    // Run initial sync
    setTimeout(() => this.syncNodes(), 5000);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running automatic node sync cron job...');
    await this.syncNodes();
  }

  /**
   * Main sync method - Fetches pNodes and updates all collections
   */
  async syncNodes(): Promise<string> {
    await this.systemStatusModel.updateOne({ id: 'main_status' }, { sync_status: 'syncing' });

    try {
      // Fetch pNodes with detailed stats
      const pNodes = await this.xandeumNetworkService.getPNodesWithDetailedStats();

      if (pNodes.length === 0) {
        throw new Error('No pNodes fetched from gossip network');
      }

      const timestamp = new Date();
      let processedCount = 0;

      // Process each node
      for (const pNode of pNodes) {
        await this.processNode(pNode as any, timestamp);
        processedCount++;
      }

      // Create network snapshot
      await this.createNetworkSnapshot(pNodes as any[], timestamp);

      // Update providers
      await this.updateProviders(pNodes as any[]);

      // Check alerts (basic implementation)
      // await this.checkAlerts(pNodes);

      // Mark as success
      await this.systemStatusModel.updateOne(
        { id: 'main_status' },
        {
          sync_status: 'success',
          last_sync_timestamp: timestamp,
          consecutive_failures: 0,
          last_error_message: null
        }
      );

      this.logger.log(`✅ Successfully synced ${processedCount} pNodes`);
      return `✅ Synced ${processedCount} pNodes`;

    } catch (error) {
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

  /**
   * Process individual node - Update nodes, metrics, and detect events
   */
  private async processNode(pNode: any, timestamp: Date) {
    const nodeId = pNode.nodeId;

    // Extract IP and port from address
    const [ip, port] = (pNode.address || ':').split(':');

    // Parse version
    const versionParts = (pNode.version || '0.0.0').match(/(\d+)\.(\d+)/);
    const versionMajor = versionParts ? parseInt(versionParts[1]) : 0;
    const versionMinor = versionParts ? parseInt(versionParts[2]) : 0;

    // Calculate derived metrics
    const storageAvailable = (pNode.storage_committed || 0) - (pNode.storage_used || 0);
    const ramAvailable = (pNode.ram_total || 0) - (pNode.ram_used || 0);
    const ramUsagePercent = pNode.ram_total > 0 ? (pNode.ram_used / pNode.ram_total) * 100 : 0;

    // Get previous state for event detection
    const previousState = this.previousNodesState.get(nodeId);

    // Prepare node data
    const nodeData = {
      node_id: nodeId,
      address: pNode.address || 'unknown',
      ip_address: ip || 'unknown',
      port: port ? parseInt(port) : 0,
      is_public: pNode.is_public || false,
      rpc_port: pNode.rpc_port || 6000,
      status: pNode.status || 'online',
      last_seen_at: timestamp,
      version: pNode.version || 'unknown',
      version_major: versionMajor,
      version_minor: versionMinor,
      current_metrics: {
        storage_committed: pNode.storage_committed || 0,
        storage_used: pNode.storage_used || 0,
        storage_available: storageAvailable,
        storage_usage_percent: pNode.storage_usage_percent || 0,
        uptime_seconds: pNode.uptime || 0,
        cpu_percent: pNode.cpu_percent,
        ram_total: pNode.ram_total,
        ram_used: pNode.ram_used,
        ram_available: ramAvailable,
        ram_usage_percent: ramUsagePercent,
        active_streams: pNode.active_streams,
        packets_sent: pNode.packets_sent,
        packets_received: pNode.packets_received,
        total_bytes: pNode.total_bytes,
        total_pages: pNode.total_pages,
        current_index: pNode.current_index,
        file_size: pNode.file_size,
        latency_ms: pNode.latency,
        last_updated_at: timestamp
      }
    };

    // Update or create node
    const existingNode = await this.nodeModel.findOne({ node_id: nodeId });

    if (existingNode) {
      await this.nodeModel.updateOne({ node_id: nodeId }, nodeData);
    } else {
      await this.nodeModel.create({ ...nodeData, first_seen_at: timestamp });

      // Create node_joined event
      await this.createEvent({
        category: 'node',
        type: 'node_joined',
        severity: 'info',
        node_id: nodeId,
        message: `Node ${nodeId.substring(0, 8)}... joined the network`,
        metadata: { version: pNode.version, address: pNode.address }
      });
    }

    // Insert time-series metric
    const packetsSentDelta = previousState?.packets_sent
      ? (pNode.packets_sent || 0) - previousState.packets_sent
      : 0;

    const packetsReceivedDelta = previousState?.packets_received
      ? (pNode.packets_received || 0) - previousState.packets_received
      : 0;

    await this.metricTimeseriesModel.create({
      node_id: nodeId,
      timestamp,
      storage: {
        committed: pNode.storage_committed || 0,
        used: pNode.storage_used || 0,
        available: storageAvailable,
        usage_percent: pNode.storage_usage_percent || 0
      },
      system: {
        uptime_seconds: pNode.uptime || 0,
        cpu_percent: pNode.cpu_percent,
        ram_total: pNode.ram_total,
        ram_used: pNode.ram_used,
        ram_usage_percent: ramUsagePercent
      },
      network: {
        active_streams: pNode.active_streams,
        packets_sent: pNode.packets_sent,
        packets_received: pNode.packets_received,
        packets_sent_delta: packetsSentDelta,
        packets_received_delta: packetsReceivedDelta,
        total_bytes: pNode.total_bytes,
        throughput_bps: (packetsSentDelta + packetsReceivedDelta) * 8 / 60 // rough estimate
      },
      storage_details: {
        total_pages: pNode.total_pages,
        current_index: pNode.current_index,
        file_size: pNode.file_size
      },
      performance: {
        latency_ms: pNode.latency,
        response_time_ms: pNode.latency
      },
      status: pNode.status || 'online'
    });

    // Detect events
    if (previousState) {
      await this.detectEvents(nodeId, previousState, pNode);
    }

    // Store current state for next comparison
    this.previousNodesState.set(nodeId, {
      storage_committed: pNode.storage_committed,
      storage_used: pNode.storage_used,
      status: pNode.status,
      version: pNode.version,
      packets_sent: pNode.packets_sent,
      packets_received: pNode.packets_received,
      cpu_percent: pNode.cpu_percent,
      ram_usage_percent: ramUsagePercent
    });
  }

  /**
   * Detect events by comparing previous and current state
   */
  private async detectEvents(nodeId: string, previous: any, current: any) {
    // Storage capacity change
    if (previous.storage_committed !== current.storage_committed) {
      const delta = (current.storage_committed || 0) - (previous.storage_committed || 0);
      await this.createEvent({
        category: 'storage',
        type: delta > 0 ? 'capacity_added' : 'capacity_removed',
        severity: 'info',
        node_id: nodeId,
        message: `Storage capacity ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta / 1e9).toFixed(2)} GB`,
        old_value: previous.storage_committed,
        new_value: current.storage_committed,
        delta
      });
    }

    // Status change
    if (previous.status !== current.status) {
      await this.createEvent({
        category: 'node',
        type: `node_${current.status}`,
        severity: current.status === 'offline' ? 'warning' : 'info',
        node_id: nodeId,
        message: `Node status changed from ${previous.status} to ${current.status}`,
        old_value: previous.status,
        new_value: current.status
      });
    }

    // Version upgrade
    if (previous.version !== current.version) {
      await this.createEvent({
        category: 'node',
        type: 'version_upgraded',
        severity: 'info',
        node_id: nodeId,
        message: `Node upgraded from ${previous.version} to ${current.version}`,
        old_value: previous.version,
        new_value: current.version
      });
    }

    // High CPU warning
    if (current.cpu_percent > 80 && previous.cpu_percent <= 80) {
      await this.createEvent({
        category: 'performance',
        type: 'high_cpu',
        severity: 'warning',
        node_id: nodeId,
        message: `CPU usage exceeded 80%: ${current.cpu_percent.toFixed(1)}%`,
        new_value: current.cpu_percent
      });
    }

    // High RAM warning
    if (current.ram_usage_percent > 80 && previous.ram_usage_percent <= 80) {
      await this.createEvent({
        category: 'performance',
        type: 'high_ram',
        severity: 'warning',
        node_id: nodeId,
        message: `RAM usage exceeded 80%: ${current.ram_usage_percent.toFixed(1)}%`,
        new_value: current.ram_usage_percent
      });
    }

    // Storage full warning
    const usagePercent = current.storage_usage_percent || 0;
    if (usagePercent > 90 && (previous.storage_usage_percent || 0) <= 90) {
      await this.createEvent({
        category: 'storage',
        type: 'storage_full',
        severity: 'critical',
        node_id: nodeId,
        message: `Storage usage exceeded 90%: ${usagePercent.toFixed(1)}%`,
        new_value: usagePercent
      });
    }
  }

  /**
   * Create event
   */
  private async createEvent(params: {
    category: string;
    type: string;
    severity: string;
    node_id: string;
    message: string;
    old_value?: any;
    new_value?: any;
    delta?: any;
    metadata?: any;
  }) {
    try {
      await this.eventModel.create({
        event_id: uuidv4(),
        timestamp: new Date(),
        category: params.category,
        type: params.type,
        severity: params.severity,
        node_id: params.node_id,
        details: {
          message: params.message,
          old_value: params.old_value,
          new_value: params.new_value,
          delta: params.delta,
          metadata: params.metadata
        }
      });
    } catch (error) {
      this.logger.debug(`Failed to create event: ${error.message}`);
    }
  }

  /**
   * Create network snapshot with comprehensive aggregates
   */
  private async createNetworkSnapshot(pNodes: any[], timestamp: Date) {
    const total = pNodes.length;

    // Node statistics
    const online = pNodes.filter(n => n.status === 'online').length;
    const offline = pNodes.filter(n => n.status === 'offline').length;
    const degraded = pNodes.filter(n => n.status === 'degraded').length;

    const idle = pNodes.filter(n => (n.storage_usage_percent || 0) < 20).length;
    const moderate = pNodes.filter(n => {
      const usage = n.storage_usage_percent || 0;
      return usage >= 20 && usage <= 80;
    }).length;
    const full = pNodes.filter(n => (n.storage_usage_percent || 0) > 80).length;

    const small = pNodes.filter(n => (n.storage_committed || 0) < 100e9).length;
    const medium = pNodes.filter(n => {
      const size = n.storage_committed || 0;
      return size >= 100e9 && size < 1e12;
    }).length;
    const large = pNodes.filter(n => {
      const size = n.storage_committed || 0;
      return size >= 1e12 && size < 10e12;
    }).length;
    const xlarge = pNodes.filter(n => (n.storage_committed || 0) >= 10e12).length;

    // Storage aggregates
    const totalCommitted = pNodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
    const totalUsed = pNodes.reduce((sum, n) => sum + (n.storage_used || 0), 0);
    const totalAvailable = totalCommitted - totalUsed;

    const usagePercents = pNodes.map(n => n.storage_usage_percent || 0).sort((a, b) => a - b);
    const avgUsage = usagePercents.reduce((sum, v) => sum + v, 0) / total;
    const medianUsage = usagePercents[Math.floor(total / 2)] || 0;
    const p95Usage = usagePercents[Math.floor(total * 0.95)] || 0;

    // System aggregates
    const cpuValues = pNodes.filter(n => n.cpu_percent).map(n => n.cpu_percent).sort((a, b) => a - b);
    const avgCpu = cpuValues.length > 0 ? cpuValues.reduce((sum, v) => sum + v, 0) / cpuValues.length : 0;
    const medianCpu = cpuValues[Math.floor(cpuValues.length / 2)] || 0;
    const p95Cpu = cpuValues[Math.floor(cpuValues.length * 0.95)] || 0;

    const ramPercents = pNodes.filter(n => n.ram_total && n.ram_used).map(n => (n.ram_used / n.ram_total) * 100).sort((a, b) => a - b);
    const avgRam = ramPercents.length > 0 ? ramPercents.reduce((sum, v) => sum + v, 0) / ramPercents.length : 0;
    const medianRam = ramPercents[Math.floor(ramPercents.length / 2)] || 0;

    const uptimes = pNodes.map(n => (n.uptime || 0) / 3600).sort((a, b) => a - b);
    const avgUptime = uptimes.reduce((sum, v) => sum + v, 0) / total;
    const medianUptime = uptimes[Math.floor(total / 2)] || 0;

    // Network aggregates
    const totalStreams = pNodes.reduce((sum, n) => sum + (n.active_streams || 0), 0);
    const totalPacketsSent = pNodes.reduce((sum, n) => sum + (n.packets_sent || 0), 0);
    const totalPacketsReceived = pNodes.reduce((sum, n) => sum + (n.packets_received || 0), 0);

    const latencies = pNodes.filter(n => n.latency).map(n => n.latency).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0 ? latencies.reduce((sum, v) => sum + v, 0) / latencies.length : 0;
    const medianLatency = latencies[Math.floor(latencies.length / 2)] || 0;

    // Distributions
    const versionMap = new Map<string, number>();
    pNodes.forEach(n => {
      const v = n.version || 'unknown';
      versionMap.set(v, (versionMap.get(v) || 0) + 1);
    });
    const byVersion = Array.from(versionMap, ([version, count]) => ({
      version,
      count,
      percent: (count / total) * 100
    }));

    const storageSizeRanges = {
      '0-100GB': small,
      '100GB-1TB': medium,
      '1TB-10TB': large,
      '10TB+': xlarge
    };
    const byStorageSize = Object.entries(storageSizeRanges).map(([range, count]) => ({ range, count }));

    // Health scores
    const availabilityPercent = (online / total) * 100;
    const reliabilityScore = Math.min(100, avgUptime / 168 * 100); // Based on 1 week
    const performanceScore = Math.max(0, 100 - avgCpu - avgRam / 2);
    const healthScore = (availabilityPercent * 0.4 + reliabilityScore * 0.3 + performanceScore * 0.3);

    await this.networkSnapshotModel.create({
      timestamp,
      nodes: {
        total, online, offline, degraded,
        idle, moderate, full,
        small, medium, large, xlarge
      },
      storage: {
        total_committed: totalCommitted,
        total_used: totalUsed,
        total_available: totalAvailable,
        average_usage_percent: avgUsage,
        median_usage_percent: medianUsage,
        p95_usage_percent: p95Usage,
        committed_growth_24h: 0, // TODO: Calculate from previous snapshot
        used_growth_24h: 0
      },
      system: {
        average_cpu_percent: avgCpu,
        median_cpu_percent: medianCpu,
        p95_cpu_percent: p95Cpu,
        average_ram_usage_percent: avgRam,
        median_ram_usage_percent: medianRam,
        average_uptime_hours: avgUptime,
        median_uptime_hours: medianUptime
      },
      network: {
        total_active_streams: totalStreams,
        total_packets_sent: totalPacketsSent,
        total_packets_received: totalPacketsReceived,
        total_throughput_gbps: 0, // TODO: Calculate
        average_latency_ms: avgLatency,
        median_latency_ms: medianLatency
      },
      distributions: {
        by_version: byVersion,
        by_storage_size: byStorageSize
      },
      health: {
        score: healthScore,
        availability_percent: availabilityPercent,
        reliability_score: reliabilityScore,
        performance_score: performanceScore
      }
    });

    this.logger.log(`✅ Network snapshot: ${total} nodes, ${(totalCommitted / 1e12).toFixed(2)} TB, Health: ${healthScore.toFixed(1)}/100`);
  }

  /**
   * Update providers by grouping nodes by IP subnet
   */
  private async updateProviders(pNodes: any[]) {
    const providerMap = new Map<string, any[]>();

    // Group nodes by /24 subnet
    pNodes.forEach(node => {
      if (!node.address || node.address === 'unknown') return;

      const ip = node.address.split(':')[0];
      const subnet = ip.split('.').slice(0, 3).join('.'); // /24 subnet

      if (!providerMap.has(subnet)) {
        providerMap.set(subnet, []);
      }
      providerMap.get(subnet)!.push(node);
    });

    // Update each provider
    for (const [subnet, nodes] of providerMap) {
      const providerId = `provider_${subnet.replace(/\./g, '_')}`;
      const providerName = `Provider ${subnet}.x`;

      const nodeIds = nodes.map(n => n.nodeId);
      const totalCount = nodes.length;
      const activeCount = nodes.filter(n => n.status === 'online').length;

      const totalStorageCommitted = nodes.reduce((sum, n) => sum + (n.storage_committed || 0), 0);
      const totalStorageUsed = nodes.reduce((sum, n) => sum + (n.storage_used || 0), 0);
      const avgUptime = nodes.reduce((sum, n) => sum + ((n.uptime || 0) / 3600), 0) / totalCount;

      const cpuNodes = nodes.filter(n => n.cpu_percent);
      const avgCpu = cpuNodes.length > 0
        ? cpuNodes.reduce((sum, n) => sum + n.cpu_percent, 0) / cpuNodes.length
        : 0;

      await this.providerModel.updateOne(
        { provider_id: providerId },
        {
          provider_id: providerId,
          provider_name: providerName,
          identification: {
            ip_ranges: [`${subnet}.0/24`]
          },
          nodes: {
            node_ids: nodeIds,
            total_count: totalCount,
            active_count: activeCount
          },
          metrics: {
            total_storage_committed: totalStorageCommitted,
            total_storage_used: totalStorageUsed,
            average_uptime_hours: avgUptime,
            average_cpu_percent: avgCpu,
            average_ram_usage_percent: 0,
            total_throughput_gbps: 0
          }
        },
        { upsert: true }
      );
    }

    this.logger.log(`✅ Updated ${providerMap.size} providers`);
  }

  // API methods for controllers
  async findAll(): Promise<Node[]> {
    return this.nodeModel.find().exec();
  }

  async findOne(nodeId: string): Promise<Node | null> {
    return this.nodeModel.findOne({ node_id: nodeId }).exec();
  }

  async getSystemStatus(): Promise<SystemStatus | null> {
    return this.systemStatusModel.findOne({ id: 'main_status' }).exec();
  }

  async getNetworkStatsHistory(limit: number = 24): Promise<NetworkSnapshot[]> {
    return this.networkSnapshotModel.find().sort({ timestamp: -1 }).limit(limit).exec();
  }

  async getNodeMetricsHistory(nodeId: string, limit: number = 24): Promise<MetricTimeseries[]> {
    return this.metricTimeseriesModel.find({ node_id: nodeId }).sort({ timestamp: -1 }).limit(limit).exec();
  }

  async getEvents(limit: number = 100): Promise<Event[]> {
    return this.eventModel.find().sort({ timestamp: -1 }).limit(limit).exec();
  }

  async getProviders(): Promise<Provider[]> {
    return this.providerModel.find().sort({ 'metrics.total_storage_committed': -1 }).exec();
  }
}
