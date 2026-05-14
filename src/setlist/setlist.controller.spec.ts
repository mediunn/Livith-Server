import { Test, TestingModule } from '@nestjs/testing';
import { SetlistController } from './setlist.controller';

describe('SetlistController', () => {
  let controller: SetlistController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SetlistController],
    }).compile();

    controller = module.get<SetlistController>(SetlistController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
