import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
const { createProxyMiddleware } = require('http-proxy-middleware');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.use((req, res, next) => {
    const allowedOrigins = [
      'http://127.0.0.1:5500',
      'https://yuri-psa.github.io',
    ];
    const origin = req.headers.origin;

    if(allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    }

    if(req.method === 'OPTIONS')
      return res.sendStatus(200);

    next();
  });

  // Proxy para auth-service
  app.use(
    createProxyMiddleware({
      target: 'http://localhost:3003',
      changeOrigin: true,
      pathFilter: '/auth',
    }),
  );

  // Proxy para solicitudes-ms
  app.use(
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathFilter: '/uploads',
    }),
  );

  app.use(
    createProxyMiddleware({
      target: 'http://localhost:3002',
      changeOrigin: true,
      pathFilter: '/api',
      pathRewrite: {
        '^/api': '',
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();