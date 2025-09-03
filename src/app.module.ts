import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './utils/exceptionFilter.service';
import { CustomLogger } from './utils/logger.service';
import { CUSTOM_LOGGER } from './utils/constant';

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: CUSTOM_LOGGER, useClass: CustomLogger },
  ],
})
export class AppModule {}
