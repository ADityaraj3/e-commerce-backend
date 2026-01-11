import { Module } from '@nestjs/common';
import { CategoryAttributesService } from './category-attributes.service';
import { CategoryAttributesController } from './category-attributes.controller';

@Module({
  providers: [CategoryAttributesService],
  controllers: [CategoryAttributesController],
})
export class CategoryAttributesModule {}
