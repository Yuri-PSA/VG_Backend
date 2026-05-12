import { Module } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';

@Module({
  controllers: [SolicitudesController],
  providers: [SolicitudesService, JwtStrategy],
})
export class SolicitudesModule {}