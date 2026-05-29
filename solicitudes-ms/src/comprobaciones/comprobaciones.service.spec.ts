import { Test, TestingModule } from '@nestjs/testing';
import { ComprobacionesService } from './comprobaciones.service';

describe('ComprobacionesService', () => {
  let service: ComprobacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComprobacionesService],
    }).compile();

    service = module.get<ComprobacionesService>(ComprobacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
