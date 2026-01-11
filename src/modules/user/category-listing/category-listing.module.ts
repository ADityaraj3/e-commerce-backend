import { Module } from '@nestjs/common';
import { CategoryListingService } from './category-listing.service';
import { CategoryListingController } from './category-listing.controller';
import { CategoryAttributesService } from 'src/modules/admin-modules/category-attributes/category-attributes.service';

@Module({
  providers: [CategoryListingService, CategoryAttributesService],
  controllers: [CategoryListingController],
})
export class CategoryListingModule {}
