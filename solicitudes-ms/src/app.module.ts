import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { SolicitudesModule } from './solicitudes/solicitudes.module';
import { ComprobacionesModule } from './comprobaciones/comprobaciones.module';
import { LiquidacionesModule } from './liquidaciones/liquidaciones.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
    PrismaModule, 
    SolicitudesModule, ComprobacionesModule, LiquidacionesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
