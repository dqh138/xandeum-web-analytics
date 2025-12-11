import { Test, TestingModule } from '@nestjs/testing';
import { PnodesService } from './pnodes.service';
import { getModelToken } from '@nestjs/mongoose';
import { PNode } from './schemas/pnode.schema';
import { XandeumNetworkService } from '../xandeum-network/xandeum-network.service';

describe('PnodesService', () => {
  let service: PnodesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PnodesService,
        {
          provide: getModelToken(PNode.name),
          useValue: {
            new: jest.fn().mockResolvedValue({}),
            constructor: jest.fn().mockResolvedValue({}),
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            save: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
            provide: XandeumNetworkService,
            useValue: {
                getProviderNodes: jest.fn(),
            }
        }
      ],
    }).compile();

    service = module.get<PnodesService>(PnodesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});