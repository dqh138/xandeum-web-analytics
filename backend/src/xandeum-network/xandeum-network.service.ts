import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Connection, PublicKey } from '@solana/web3.js';
import axios from 'axios';
import { PrpcClient, Pod } from 'xandeum-prpc';

@Injectable()
export class XandeumNetworkService implements OnModuleInit {
  private connection: Connection;
  private readonly logger = new Logger(XandeumNetworkService.name);
  // Xandeum DevNet RPC
  private readonly rpcUrl = 'https://api.devnet.xandeum.com:8899';
  // Xandeum pNode API (the actual pNode registry)
  private readonly pNodeApiUrl = 'https://seenodes.xandeum.com';
  // Xandeum pNode Program ID (from xandminerd source code)
  private readonly PNODE_PROGRAM_ID = new PublicKey('6Bzz3KPvzQruqBg2vtsvkuitd6Qb4iCcr5DViifCwLsL');
  // pNode index account (from xandminerd source code)
  private readonly PNODE_INDEX_ACCOUNT = new PublicKey('GHTUesiECzPRHTShmBGt9LiaA89T8VAzw8ZWNE6EvZRs');

  onModuleInit() {
    this.connection = new Connection(this.rpcUrl, 'confirmed');
    this.logger.log(`Connected to Xandeum Network at ${this.rpcUrl}`);
  }

  async getProviderNodes(retries = 3, delay = 1000) {
    for (let i = 0; i < retries; i++) {
      try {
        this.logger.log(`Fetching pNodes from RPC (Attempt ${i + 1}/${retries})...`);
        const response = await axios.post(this.rpcUrl, {
          jsonrpc: '2.0',
          method: 'getClusterNodes',
          id: 1,
        }, { timeout: 5000 }); // 5s timeout

        if (response.data && response.data.result) {
          this.logger.log(`Fetched ${response.data.result.length} nodes from RPC.`);
          return response.data.result.map((node: any) => ({
            nodeId: node.pubkey,
            address: node.gossip || node.rpc || 'unknown',
            is_public: node.rpc ? true : false,
            last_seen_timestamp: Date.now(),
            rpc_port: node.rpc ? parseInt(node.rpc.split(':')[1]) : 0,
            storage_committed: 0,
            storage_usage_percent: 0,
            storage_used: 0,
            uptime: 0,
            version: node.version || 'unknown',
            status: 'online',
          }));
        } else {
          throw new Error('Invalid RPC response format');
        }
      } catch (error) {
        this.logger.warn(`Attempt ${i + 1} failed: ${error.message}`);
        if (i === retries - 1) {
          this.logger.error(`All ${retries} attempts to fetch nodes failed.`);
          return [];
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * getVersion: Trả về thông tin build của node
   * Returns the current Solana/Xandeum version running on the node
   */
  async getVersion() {
    try {
      this.logger.log('Fetching node version from RPC...');
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        method: 'getVersion',
        id: 1,
      });

      if (response.data && response.data.result) {
        this.logger.log(`Node version: ${JSON.stringify(response.data.result)}`);
        return response.data.result;
      } else {
        throw new Error('Invalid RPC response');
      }
    } catch (error) {
      this.logger.error(`Failed to fetch version from RPC: ${error.message}`);
      return {
        'solana-core': 'unknown',
        'feature-set': 0,
      };
    }
  }

  /**
   * getHealth: Trả về trạng thái đồng bộ hóa dữ liệu
   * Returns the current health of the node
   */
  async getHealth() {
    try {
      this.logger.log('Checking node health from RPC...');
      const response = await axios.post(this.rpcUrl, {
        jsonrpc: '2.0',
        method: 'getHealth',
        id: 1,
      });

      // getHealth returns "ok" string on success, or error on failure
      if (response.data && response.data.result === 'ok') {
        this.logger.log('Node health: OK');
        return { status: 'ok', healthy: true };
      } else if (response.data && response.data.error) {
        this.logger.warn(`Node health check failed: ${response.data.error.message}`);
        return {
          status: 'unhealthy',
          healthy: false,
          error: response.data.error.message
        };
      } else {
        throw new Error('Invalid RPC response');
      }
    } catch (error) {
      this.logger.error(`Failed to check health from RPC: ${error.message}`);
      return {
        status: 'error',
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Helper method to parse pNode registry account data
   * Structure derived from on-chain analysis:
   * - 0-32: PNode Pubkey (32 bytes)
   * - 32: Status (1 byte)
   * - 33: Reserved/Padding (1 byte)
   * - 34-42: Last Seen Timestamp (u64, 8 bytes)
   * - 42-74: Extended Data (32 bytes) - possibly storage hash or address
   */
  private parseRegistryAccountData(data: Buffer): any {
    try {
      if (data.length < 42) {
        return null;
      }

      const pNodePubkey = new PublicKey(data.slice(0, 32));
      const status = data.readUInt8(32);
      // const padding = data.readUInt8(33);
      const lastSeenSeconds = Number(data.readBigUInt64LE(34));

      // Attempt to read next fields as u64s for storage metrics
      // This is speculative based on common Solana structures
      let storageCommitted = 0;
      let storageUsed = 0;

      // If data is long enough, try reading potential storage fields
      if (data.length >= 58) {
        // data.readBigUInt64LE(42) - might be extended data
        // data.readBigUInt64LE(50)
      }

      return {
        nodeId: pNodePubkey.toBase58(),
        status: status === 1 ? 'online' : 'registered', // Guessing 1 = online
        last_seen_timestamp: lastSeenSeconds * 1000,
        // Since we haven't confirmed storage layout, we'll leave as 0 or try to infer
        storage_committed: 0,
        storage_used: 0,
        storage_usage_percent: 0,
        version: 'pNode-v2.2.0', // Updated based on observed network version
        // address: ... (likely in extended data)
      };

    } catch (error) {
      this.logger.error(`Failed to parse registry account data: ${error.message}`);
      return null;
    }
  }

  /**
   * getPNodeStats: Call pNode RPC (pRPC) 'get-stats' method
   * @param nodeAddress The IP:Port of the pNode (e.g., '127.0.0.1:8080')
   */
  async getPNodeStats(nodeAddress: string) {
    try {
      if (!nodeAddress || nodeAddress === 'unknown') return null;

      // Assume HTTP protocol if not specified
      const url = nodeAddress.startsWith('http') ? nodeAddress : `http://${nodeAddress}`;

      this.logger.debug(`Calling pRPC get-stats on ${url}...`);

      const response = await axios.post(url, {
        jsonrpc: '2.0',
        method: 'get-stats',
        id: 1,
        params: []
      }, { timeout: 3000 });

      if (response.data && response.data.result) {
        return response.data.result;
      }
      return null;
    } catch (error) {
      // Don't log full error to avoid noise for unreachable nodes
      this.logger.debug(`Failed to call pRPC on ${nodeAddress}: ${error.message}`);
      return null;
    }
  }

  /**
   * getRegisteredPNodes: Query registered pNodes from Xandeum smart contract
   * Returns real on-chain data about storage provider nodes with detailed info
   */
  async getRegisteredPNodes() {
    // Skip API call since we know it's down
    // const apiNodes = await this.getPNodesFromRegistry();
    // if (apiNodes && apiNodes.length > 0) return apiNodes;

    try {
      this.logger.log('Fetching registered pNodes from smart contract...');

      // Get the pNode index account data
      const accountInfo = await this.connection.getAccountInfo(this.PNODE_INDEX_ACCOUNT);

      if (!accountInfo || !accountInfo.data) {
        this.logger.warn('pNode index account not found or empty');
        return [];
      }

      this.logger.log(`pNode index account data size: ${accountInfo.data.length} bytes`);

      // Parse the account data to get pNode public keys
      const data = accountInfo.data;
      const pNodePubkeys: PublicKey[] = [];

      // Skip discriminator (8 bytes) and parse pNode entries
      let offset = 8;
      // Index parsing - we assume this is correct as it yields keys
      while (offset + 32 <= data.length) {
        try {
          const pNodePubkey = new PublicKey(data.slice(offset, offset + 32));

          // Skip zero/empty entries
          if (!pNodePubkey.equals(PublicKey.default)) {
            pNodePubkeys.push(pNodePubkey);
          }

          offset += 32;
        } catch (err) {
          this.logger.warn(`Failed to parse pNode at offset ${offset}: ${err.message}`);
          break;
        }
      }

      this.logger.log(`Found ${pNodePubkeys.length} registered pNode public keys in Index`);

      if (pNodePubkeys.length === 0) {
        this.logger.warn('No pNode public keys found in index account');
        return [];
      }

      // Now fetch detailed info for each pNode by querying their registry accounts
      const pNodesWithDetails = await Promise.all(
        pNodePubkeys.slice(0, 300).map(async (pNodePubkey) => { // Limit to 300 to cover all
          try {
            // Derive the registry PDA for this pNode
            const [registryPDA] = PublicKey.findProgramAddressSync(
              [Buffer.from('registry'), pNodePubkey.toBuffer()],
              this.PNODE_PROGRAM_ID
            );

            // Fetch the registry account data
            const registryAccount = await this.connection.getAccountInfo(registryPDA);

            if (registryAccount && registryAccount.data) {
              // Try to parse the registry data
              const parsedData = this.parseRegistryAccountData(registryAccount.data);

              if (parsedData) {
                // If we have an address, try to fetch real-time stats via pRPC
                let metrics = null;
                if (parsedData.address && parsedData.address !== 'unknown') {
                  try {
                    const statsDetails = await this.getPNodeStats(parsedData.address);
                    if (statsDetails) {
                      metrics = {
                        storage_committed: statsDetails.storage?.committed || 0,
                        storage_used: statsDetails.storage?.used || 0,
                        storage_usage_percent: statsDetails.storage?.usagePercent || 0,
                        uptime: statsDetails.system?.uptime || 0,
                        version: statsDetails.system?.version || parsedData.version,
                      };
                    }
                  } catch (e) {
                    // Ignore pRPC verify errors for now
                  }
                }

                return {
                  ...parsedData,
                  ...metrics, // Override/Merge with real stats if available
                  registryAccount: registryPDA.toBase58(),
                  dataSize: registryAccount.data.length,
                  registeredAt: new Date().toISOString(),
                  // If address was unknown from chain, keep it unknown unless we have a discovery mechanism
                  address: parsedData.address || 'unknown'
                };
              }
            }

            // If no registry account or parsing failed, return basic info
            return {
              nodeId: pNodePubkey.toBase58(),
              type: 'pNode',
              status: 'registered',
              storage_committed: 0,
              storage_used: 0,
              storage_usage_percent: 0,
              last_seen_timestamp: Date.now(),
              registeredAt: new Date().toISOString(),
              version: 'unknown',
              address: 'unknown',
            };

          } catch (err) {
            this.logger.warn(`Failed to fetch details for pNode ${pNodePubkey.toBase58()}: ${err.message}`);
            return null;
          }
        })
      );

      const validNodes = pNodesWithDetails.filter(node => node !== null);
      this.logger.log(`Successfully fetched details for ${validNodes.length} pNodes from on-chain data`);
      return validNodes;

    } catch (error) {
      this.logger.error(`Failed to fetch registered pNodes: ${error.message}`);
      return [];
    }
  }

  /**
   * getPNodesFromGossip: Fetch pNodes from gossip network using xandeum-prpc
   * This method provides COMPLETE node data including IP addresses and storage metrics
   * Uses seed nodes to discover all pNodes in the network via gossip protocol
   */
  async getPNodesFromGossip() {
    const seedIps = PrpcClient.defaultSeedIps;

    this.logger.log(`Fetching pNodes from gossip network using ${seedIps.length} seed nodes...`);

    // Try each seed until we get a successful response
    for (const seedIp of seedIps) {
      try {
        this.logger.debug(`Trying seed node: ${seedIp}...`);

        const client = new PrpcClient(seedIp, { timeout: 10000 }); // 10s timeout
        const response = await client.getPodsWithStats();

        if (response && response.pods && response.pods.length > 0) {
          this.logger.log(`✅ Successfully fetched ${response.total_count} pNodes from gossip network via ${seedIp}`);

          // Transform Pod interface to our pNode format
          // Filter out pods without pubkey (required field)
          const pNodes = response.pods
            .filter((pod: Pod) => pod.pubkey) // Only include pods with pubkey
            .map((pod: Pod) => ({
              nodeId: pod.pubkey,
              address: pod.address || 'unknown',
              is_public: pod.is_public || false,
              rpc_port: pod.rpc_port || 6000,
              status: 'online', // If in gossip, it's online
              version: pod.version || 'unknown',
              storage_committed: pod.storage_committed || 0,
              storage_used: pod.storage_used || 0,
              storage_usage_percent: pod.storage_usage_percent || 0,
              uptime: pod.uptime || 0,
              last_seen_timestamp: pod.last_seen_timestamp || Date.now(),
              registeredAt: new Date().toISOString(),
            }));

          this.logger.log(`✅ Filtered to ${pNodes.length} valid pNodes with pubkey`);

          return pNodes;
        }
      } catch (error) {
        this.logger.debug(`Seed ${seedIp} failed: ${error.message}`);
        // Continue to next seed
      }
    }

    this.logger.warn('All seed nodes failed. Falling back to on-chain registry...');
    return [];
  }

  /**
   * getPNodesWithDetailedStats: Fetch pNodes from gossip and enrich with detailed stats
   * Makes individual getStats() calls to each node for comprehensive metrics
   */
  async getPNodesWithDetailedStats() {
    // First get basic pNodes from gossip
    const pNodes = await this.getPNodesFromGossip();

    if (pNodes.length === 0) {
      return [];
    }

    this.logger.log(`Enriching ${pNodes.length} pNodes with detailed stats...`);

    // Enrich with detailed stats (parallel calls with limit to avoid overwhelming)
    const enrichedNodes = await Promise.all(
      pNodes.map(async (node) => {
        try {
          // Only try if we have a valid address
          if (!node.address || node.address === 'unknown') {
            return node;
          }

          const startTime = Date.now();
          const client = new PrpcClient(node.address.split(':')[0], { timeout: 5000 });
          const stats = await client.getStats();
          const latency = Date.now() - startTime;

          // Calculate derived metrics
          const storage_available = (stats.file_size || node.storage_committed || 0) - (stats.total_bytes || node.storage_used || 0);
          const ram_usage_percent = stats.ram_total > 0 ? (stats.ram_used / stats.ram_total) * 100 : 0;

          return {
            ...node,
            // Enrich with detailed stats
            active_streams: stats.active_streams,
            cpu_percent: stats.cpu_percent,
            ram_total: stats.ram_total,
            ram_used: stats.ram_used,
            ram_usage_percent,
            packets_received: stats.packets_received,
            packets_sent: stats.packets_sent,
            total_bytes: stats.total_bytes,
            total_pages: stats.total_pages,
            current_index: stats.current_index,
            file_size: stats.file_size,
            last_updated: stats.last_updated,
            storage_available,
            latency,
          };
        } catch (error) {
          // If getStats fails, return node with basic data
          this.logger.debug(`Failed to get detailed stats for ${node.nodeId?.substring(0, 8) || 'unknown'}: ${error.message}`);
          return node;
        }
      })
    );

    const enrichedCount = enrichedNodes.filter(n => (n as any).cpu_percent !== undefined).length;
    this.logger.log(`✅ Successfully enriched ${enrichedCount}/${pNodes.length} pNodes with detailed stats`);

    return enrichedNodes;
  }

  /**
   * fetchGeoDataBatch: Fetch Geolocation data for a batch of IPs using ip-api.com
   * @param ips Array of IP addresses
   */
  async fetchGeoDataBatch(ips: string[]) {
    if (!ips || ips.length === 0) return {};

    this.logger.log(`Fetching Geo data for ${ips.length} IPs...`);
    const geoMap: Record<string, any> = {};

    // ip-api.com batch limit is 100
    const chunkSize = 100;
    for (let i = 0; i < ips.length; i += chunkSize) {
      const chunk = ips.slice(i, i + chunkSize);

      try {
        const response = await axios.post('http://ip-api.com/batch', chunk, {
          timeout: 10000
        });

        if (response.data && Array.isArray(response.data)) {
          response.data.forEach((item: any) => {
            if (item.status === 'success') {
              geoMap[item.query] = {
                country: item.country,
                city: item.city,
                latitude: item.lat,
                longitude: item.lon,
              };
            }
          });
        }

        // Basic rate limiting (avoid spamming if we have many chunks)
        if (i + chunkSize < ips.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        this.logger.error(`Failed to fetch Geo batch: ${error.message}`);
      }
    }

    return geoMap;
  }
}
