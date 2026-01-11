import { Controller, Get, Param } from '@nestjs/common';
import { CategoryListingService } from './category-listing.service';

@Controller('category-listing')
export class CategoryListingController {
  constructor(
    private readonly categoryListingService: CategoryListingService,
  ) {}

  @Get('parents')
  async getParentCategories() {
    return await this.categoryListingService.getParentCategories();
  }

  @Get('children/:parentId')
  async getChildCategories(@Param('parentId') parentId: string) {
    return await this.categoryListingService.getChildCategories(parentId);
  }

  @Get('filters/:categoryId')
  async getCategoryFilters(@Param('categoryId') categoryId: string) {
    return await this.categoryListingService.getCategoryFilters(categoryId);
  }
}
