import { Test, TestingModule } from '@nestjs/testing';
import { PnodesController } from './pnodes.controller';
import { PnodesService } from './pnodes.service';

describe('PnodesController', () => {
  let controller: PnodesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PnodesController],
      providers: [
        {
            provide: PnodesService,
            useValue: {
                create: jest.fn(),
                findAll: jest.fn(),
                findOne: jest.fn(),
                syncNodes: jest.fn()
            }
        }
      ]
    }).compile();

    controller = module.get<PnodesController>(PnodesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});