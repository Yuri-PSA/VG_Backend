import { Module } from '@nestjs/common';
import { ComprobacionesService } from './comprobaciones.service';
import { ComprobacionesController } from './comprobaciones.controller';

@Module({
  controllers: [ComprobacionesController],
  providers: [ComprobacionesService],
})
export class ComprobacionesModule {}
