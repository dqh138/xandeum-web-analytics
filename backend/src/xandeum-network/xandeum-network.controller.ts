import { Controller, Get } from '@nestjs/common';
import { XandeumNetworkService } from './xandeum-network.service';

@Controller('network')
export class XandeumNetworkController {
    constructor(private readonly xandeumNetworkService: XandeumNetworkService) { }

    /**
     * GET /network/version
     * Trả về thông tin build của node
     */
    @Get('version')
    async getVersion() {
        return this.xandeumNetworkService.getVersion();
    }

    /**
     * GET /network/health
     * Trả về trạng thái đồng bộ hóa dữ liệu
     */
    @Get('health')
    async getHealth() {
        return this.xandeumNetworkService.getHealth();
    }

    /**
     * GET /network/info
     * Trả về thông tin tổng hợp về network
     */
    @Get('info')
    async getNetworkInfo() {
        const [version, health] = await Promise.all([
            this.xandeumNetworkService.getVersion(),
            this.xandeumNetworkService.getHealth(),
        ]);

        return {
            version,
            health,
            rpcEndpoint: 'https://api.devnet.xandeum.com:8899',
            network: 'devnet',
        };
    }
}
