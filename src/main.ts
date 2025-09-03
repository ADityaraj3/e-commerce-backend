import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';
import { TransformInterceptor } from './utils/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*',
  });
  
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('E-C')
    .setDescription('API documentation for E-Com backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(8989);
  console.log(`🎯 http://localhost:${8989}/api`);
}
bootstrap();
