import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // ✅ Create Category
  async create(createCategoryDto: CreateCategoryDto, userId: string) {
    try {
      // 1️⃣ Check if category already exists
      // const existing = await this.prisma.category.findFirst({
      //   where: {
      //     category_name: {
      //       equals: createCategoryDto.category_name,
      //       mode: 'insensitive', // case-insensitive match
      //     },
      //     is_archived: false,
      //   },
      // });

      // 2️⃣ If exists → throw error
      // ** Things that need to be discussed: ** // What if there are 2 cateogries let say T-shirt, one for Men and other for Women
      // if (existing) {
      //   return sendBadRequest(
      //     `Category ${createCategoryDto.category_name} already exists`,
      //   );
      // }

      // 3️⃣ Create new category
      return await this.prisma.category.create({
        data: {
          category_name: createCategoryDto.category_name,
          parent_id: createCategoryDto.parent_id || null,
          media_id: createCategoryDto.media_id || null,
          created_by: userId,
        },
      });
    } catch (error) {
      throw new BadRequestException(
        error?.message || 'Failed to create category',
      );
    }
  }

  // ✅ Get All Categories
  async findAll() {
    try {
      const categories = await this.prisma.category.findMany({
        orderBy: {
          category_name: 'asc', // ** Things that need to be discussed: ** // We need to decide on which field this needs to be sorted.
        },
        where: {
          is_archived: false,
        },
      });

      const nestedCategories = this.buildCategoryTree(categories);

      return nestedCategories;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  // ✅ Get One Category
  // async findOne(id: string) {
  //   const category = await this.prisma.category.findUnique({
  //     where: { category_id: id },
  //     include: {
  //       media: true,
  //       categories: true,
  //       other_categories: true,
  //       category_attributes: true,
  //       category_offers: true,
  //       products: true,
  //     },
  //   });

  //   if (!category) {
  //     throw new NotFoundException(`Category with id ${id} not found`);
  //   }

  //   return category;
  // }

  // ✅ Update Category

  async update(
    categoryId: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ) {
    return this.prisma.category.update({
      where: { category_id: categoryId },
      data: {
        category_name: updateCategoryDto.category_name,
        is_active: updateCategoryDto.is_active,
        parent_id: updateCategoryDto.parent_id || null,
        updated_at: new Date(),
        updated_by: userId,
      },
    });
  }

  // // ✅ Delete Category
  // async remove(id: string) {
  //   return this.prisma.category.delete({
  //     where: { category_id: id },
  //   });
  // }

  buildCategoryTree = (categories: any[]) => {
    const map = new Map();
    const roots: any[] = [];

    // Create a map of category_id → category object
    categories.forEach((cat) => {
      map.set(cat.category_id, {
        ...cat,
        children: [], // add this field
      });
    });

    // Assign each category to its parent
    categories.forEach((cat) => {
      const node = map.get(cat.category_id);

      if (cat.parent_id) {
        const parent = map.get(cat.parent_id);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        // No parent means this is a ROOT category
        roots.push(node);
      }
    });

    return roots;
  };
}
