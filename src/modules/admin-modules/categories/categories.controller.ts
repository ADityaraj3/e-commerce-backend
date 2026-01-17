import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AdminAuthGuard } from 'src/utils/guards/admin-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserId } from 'src/utils/decorators';

@Controller('categories')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  create(
    @Body() createCategoryDto: CreateCategoryDto,
    @UserId() userId: string,
  ) {
    return this.categoriesService.create(createCategoryDto, userId);
  }

  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.categoriesService.findOne(+id);
  // }

  @Patch(':category_id')
  update(
    @Param('category_id') categoryId: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @UserId() userId: string,
  ) {
    return this.categoriesService.update(categoryId, updateCategoryDto, userId);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.categoriesService.remove(+id);
  // }
}
