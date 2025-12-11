import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Connection } from '@solana/web3.js';
import axios from 'axios';

@Injectable()
export class XandeumNetworkService implements OnModuleInit {
  private connection: Connection;
  private readonly logger = new Logger(XandeumNetworkService.name);
  // Correct RPC URL from web search
  private readonly rpcUrl = 'https://api.devnet.xandeum.com:8899';

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
}
