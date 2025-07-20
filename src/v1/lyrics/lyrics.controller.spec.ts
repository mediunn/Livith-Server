import { Test, TestingModule } from '@nestjs/testing';
import { LyricsController } from './lyrics.controller';

describe('LyricsController', () => {
  let controller: LyricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LyricsController],
    }).compile();

    controller = module.get<LyricsController>(LyricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
