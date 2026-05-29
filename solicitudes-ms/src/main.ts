import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Crear carpetas
  const baseDirs = [
    'uploads/comprobantes/anticipos',
    'uploads/comprobantes/liquidaciones',
    'uploads/facturas/pdf',
    'uploads/facturas/xml',
    'uploads/facturas/img',
  ];

  baseDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if(!fs.existsSync(fullPath))
      fs.mkdirSync(fullPath, { recursive: true });
  });
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Servir archivos estáticos -> imágenes de comprobantes
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.listen(3002);
}
bootstrap();
