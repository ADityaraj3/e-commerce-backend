import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionFilter } from './utils/exceptionFilter.service';
import { CustomLogger } from './utils/logger.service';
import { CUSTOM_LOGGER } from './utils/constant';
import { CategoriesModule } from './modules/admin-modules/categories/categories.module';
import { AdminAuthModule } from './modules/admin-modules/admin-auth/admin-auth.module';
import { ConfigModule } from '@nestjs/config';
import { CategoryAttributesModule } from './modules/admin-modules/category-attributes/category-attributes.module';
import { MediaModule } from './modules/user/media/media.module';
import { CouponsModule } from './modules/admin-modules/coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CategoriesModule,
    AdminAuthModule,
    CategoryAttributesModule,
    MediaModule,
    CouponsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionFilter },
    { provide: CUSTOM_LOGGER, useClass: CustomLogger },
  ],
})
export class AppModule {}
