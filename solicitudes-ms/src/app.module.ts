import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { SolicitudesModule } from './solicitudes/solicitudes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), 
    JwtModule.register({
      secret: 'Lo movemos a env?',
      signOptions: { expiresIn: '8h' },
    }),
    PrismaModule, 
    SolicitudesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
