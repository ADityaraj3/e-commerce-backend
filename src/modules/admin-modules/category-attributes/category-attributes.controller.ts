import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CategoryAttributesService } from './category-attributes.service';
import { CreateCategoryAttributeDto } from './dto/create-category-attribute.dto';
import { UserId } from 'src/utils/decorators';
import { UpdateCategoryAttributeDto } from './dto/update-category-attributes.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('category-attributes')
@ApiBearerAuth()
export class CategoryAttributesController {
  constructor(
    private readonly categoryAttributesService: CategoryAttributesService,
  ) {}

  @Post('')
  create(
    @Body() createAttributeDto: CreateCategoryAttributeDto,
    @UserId() userId: string,
  ) {
    return this.categoryAttributesService.create(createAttributeDto, userId);
  }

  @Get(':cateogry_id')
  getCategoryAttributes(@Param('cateogry_id') cateogryId: string) {
    return this.categoryAttributesService.getCategoryAttributes(cateogryId);
  }

  @Patch(':category_attribute_id')
  update(
    @Body() updateCategoryAttributeDto: UpdateCategoryAttributeDto,
    @UserId() userId: string,
    @Param('category_attribute_id') categoryAttributeId: string,
  ) {
    return this.update(updateCategoryAttributeDto, userId, categoryAttributeId);
  }
}
