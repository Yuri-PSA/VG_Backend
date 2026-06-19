import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AzureSyncService } from './azure-sync.service';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    ConfigModule.forRoot({ isGlobal: true }), 
    ScheduleModule.forRoot(),
    JwtModule.register({
      secret: process.env.JWT_SECRET!,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  providers: [AuthService, JwtStrategy, AzureSyncService],
  controllers: [AuthController]
})
export class AuthModule {}