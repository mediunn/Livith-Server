import { Test, TestingModule } from '@nestjs/testing';
import { FetchConcertService } from './fetch-concert.service';

describe('FetchConcertService', () => {
  let service: FetchConcertService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FetchConcertService],
    }).compile();

    service = module.get<FetchConcertService>(FetchConcertService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
