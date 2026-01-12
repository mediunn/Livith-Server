import { Test, TestingModule } from '@nestjs/testing';
import { SetlistService } from './setlist.service';

describe('SetlistService', () => {
  let service: SetlistService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SetlistService],
    }).compile();

    service = module.get<SetlistService>(SetlistService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
