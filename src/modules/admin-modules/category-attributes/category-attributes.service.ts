import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { UpdateCategoryAttributeDto } from './dto/update-category-attributes.dto';

@Injectable()
export class CategoryAttributesService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCategoryAttributeDto: CreateCategoryAttributeDto,
    userId: string,
  ) {
    try {
      const {
        attribute_name,
        attribute_type,
        category_id,
        display_sequence,
        is_required,
      } = createCategoryAttributeDto;

      // Get parent category IDs
      const parentCategoryIds = await this.getAllParentCategoryIds(category_id);

      // List of categories to check (current + parents)
      const checkCategoryIds = [category_id, ...parentCategoryIds];

      // Check if attribute exists in current or parent categories (name/type OR display_sequence)
      const existing = await this.prisma.categoryAttribute.findFirst({
        where: {
          OR: [
            {
              attribute_name: {
                equals: attribute_name,
                mode: 'insensitive',
              },
              attribute_type: {
                equals: attribute_type,
                mode: 'insensitive',
              },
              category_id: {
                in: checkCategoryIds,
              },
            },
            {
              display_sequence: display_sequence,
              category_id: {
                in: checkCategoryIds,
              },
            },
          ],
          is_archived: false,
        },
      });

      if (existing) {
        // Check which condition matched
        if (
          existing.attribute_name?.toLowerCase() ===
            attribute_name.toLowerCase() &&
          existing.attribute_type?.toLowerCase() ===
            attribute_type.toLowerCase()
        ) {
          throw new BadRequestException(
            'Attribute with this name and type already exists in this category or its parent categories.',
          );
        } else if (existing.display_sequence === display_sequence) {
          throw new BadRequestException(
            'This display sequence already exists in this category or its parent categories.',
          );
        }
      }

      // Create new attribute
      const categoryAttribute = await this.prisma.categoryAttribute.create({
        data: {
          attribute_name,
          attribute_type,
          category_id,
          display_sequence,
          is_required: is_required ?? false,
          created_by: userId,
        },
      });

      return categoryAttribute;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async update(
    updateCategoryAttributeDto: UpdateCategoryAttributeDto,
    userId: string,
    categoryAttributeId: string,
  ) {
    try {
      // Get parent category IDs
      const parentCategoryIds = await this.getAllParentCategoryIds(
        updateCategoryAttributeDto.category_id,
      );

      // List of categories to check (current + parents)
      const checkCategoryIds = [
        updateCategoryAttributeDto.category_id,
        ...parentCategoryIds,
      ];

      // Check if attribute exists in current or parent categories (name/type OR display_sequence)
      const existing = await this.prisma.categoryAttribute.findFirst({
        where: {
          OR: [
            {
              attribute_name: {
                equals: updateCategoryAttributeDto.attribute_name,
                mode: 'insensitive',
              },
              attribute_type: {
                equals: updateCategoryAttributeDto.attribute_type,
                mode: 'insensitive',
              },
              category_id: {
                in: checkCategoryIds,
              },
            },
            {
              display_sequence: updateCategoryAttributeDto.display_sequence,
              category_id: {
                in: checkCategoryIds,
              },
            },
          ],
          is_archived: false,
        },
      });

      if (existing) {
        // Check which condition matched
        if (
          existing.attribute_name?.toLowerCase() ===
            updateCategoryAttributeDto.attribute_name.toLowerCase() &&
          existing.attribute_type?.toLowerCase() ===
            updateCategoryAttributeDto.attribute_type.toLowerCase()
        ) {
          throw new BadRequestException(
            'Attribute with this name and type already exists in this category or its parent categories.',
          );
        } else if (
          existing.display_sequence ===
          updateCategoryAttributeDto.display_sequence
        ) {
          throw new BadRequestException(
            'This display sequence already exists in this category or its parent categories.',
          );
        }
      }

      const updatedCategoryAttribute =
        await this.prisma.categoryAttribute.update({
          where: {
            attribute_id: categoryAttributeId,
          },
          data: {
            attribute_name: updateCategoryAttributeDto.attribute_name,
            attribute_type: updateCategoryAttributeDto.attribute_type,
            category_id: updateCategoryAttributeDto.category_id,
            display_sequence: updateCategoryAttributeDto.display_sequence,
            is_required: updateCategoryAttributeDto.is_required ?? false,
            updated_by: userId,
          },
        });

      return updatedCategoryAttribute;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getCategoryAttributes(categoryId: string) {
    try {
      // Step 1: collect all parent category IDs
      const categoryIds = await this.getAllParentCategoryIds(categoryId);

      // Step 2: fetch attributes of this category and all parents
      const categoryAttributes = await this.prisma.categoryAttribute.findMany({
        where: {
          category_id: {
            in: categoryIds,
          },
          is_archived: false,
        },
        orderBy: {
          updated_at: 'desc',
        },
      });

      return categoryAttributes;
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Error fetching attributes',
      );
    }
  }

  public async getAllParentCategoryIds(categoryId: string): Promise<string[]> {
    const ids = [categoryId];

    let current = await this.prisma.category.findUnique({
      where: { category_id: categoryId, is_archived: false },
      select: { parent_id: true },
    });

    while (current?.parent_id) {
      ids.push(current.parent_id);

      current = await this.prisma.category.findUnique({
        where: { category_id: current.parent_id, is_archived: false },
        select: { parent_id: true },
      });
    }

    return ids;
  }
}
