import { Module } from '@nestjs/common';
import { AdminProductController } from './admin-product.controller';
import { AdminProductService } from './admin-product.service';
import { AiProductParserController } from './ai-product-parser.controller';
import { AiProductParserService } from './ai-product-parser.service';

@Module({
  controllers: [AdminProductController, AiProductParserController],
  providers: [AdminProductService, AiProductParserService],
})
export class AdminProductModule {}
