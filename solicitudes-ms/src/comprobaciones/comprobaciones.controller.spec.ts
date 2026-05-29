import { Test, TestingModule } from '@nestjs/testing';
import { ComprobacionesController } from './comprobaciones.controller';
import { ComprobacionesService } from './comprobaciones.service';

describe('ComprobacionesController', () => {
  let controller: ComprobacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComprobacionesController],
      providers: [ComprobacionesService],
    }).compile();

    controller = module.get<ComprobacionesController>(ComprobacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
