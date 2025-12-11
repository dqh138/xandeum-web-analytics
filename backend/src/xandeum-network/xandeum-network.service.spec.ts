import { Test, TestingModule } from '@nestjs/testing';
import { XandeumNetworkService } from './xandeum-network.service';

describe('XandeumNetworkService', () => {
  let service: XandeumNetworkService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [XandeumNetworkService],
    }).compile();

    service = module.get<XandeumNetworkService>(XandeumNetworkService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
