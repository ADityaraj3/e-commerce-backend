import { BadRequestException, Injectable } from '@nestjs/common';
import { CategoryAttributesService } from 'src/modules/admin-modules/category-attributes/category-attributes.service';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ICategoryFilters } from 'src/utils/interfaces/interface.utils';

@Injectable()
export class CategoryListingService {
  constructor(
    private prisma: PrismaService,
    private categoryAttributesService: CategoryAttributesService,
  ) {}

  async getParentCategories() {
    try {
      const parentCategories = await this.prisma.category.findMany({
        where: {
          parent_id: null,
        },
      });

      return parentCategories;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getChildCategories(parentId: string) {
    try {
      const childCategories = await this.prisma.category.findMany({
        where: {
          parent_id: parentId,
        },
      });

      return childCategories;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getCategoryFilters(categoryId: string) {
    try {
      const parentCategoryIds: string[] =
        await this.categoryAttributesService.getAllParentCategoryIds(
          categoryId,
        );

      const checkCategoryIds: string[] = [...parentCategoryIds, categoryId];

      const attributes = await this.prisma.categoryAttribute.findMany({
        where: {
          category_id: {
            in: checkCategoryIds,
          },
        },
        select: {
          attribute_id: true,
          attribute_name: true,
          variant_attribute: {
            select: {
              attribute_value: true,
            },
          },
        },
      });

      const filters: ICategoryFilters[] = attributes.map((attr) => ({
        name: attr.attribute_name,
        value: attr.variant_attribute.map((v) => v.attribute_value),
      }));

      return filters;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
