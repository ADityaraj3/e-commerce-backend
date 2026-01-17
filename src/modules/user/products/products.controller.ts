import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all products with filters' })
  @ApiQuery({ name: 'category_id', required: false })
  @ApiQuery({ name: 'is_new_arrival', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved products',
  })
  async getAllProducts(
    @Query('category_id') categoryId?: string,
    @Query('is_new_arrival') isNewArrival?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.getAllProducts({
      category_id: categoryId,
      is_new_arrival: isNewArrival === 'true',
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get(':product_id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved product',
  })
  async getProductById(@Param('product_id') productId: string) {
    return this.productsService.getProductById(productId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product details by slug' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved product',
  })
  async getProductBySlug(@Param('slug') slug: string) {
    return this.productsService.getProductBySlug(slug);
  }

  @Get('category/:category_id')
  @ApiOperation({ summary: 'Get products by category' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'offset', required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved products',
  })
  async getProductsByCategory(
    @Param('category_id') categoryId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.productsService.getProductsByCategory(categoryId, {
      limit: limit ? parseInt(limit) : 20,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get('featured/list')
  @ApiOperation({ summary: 'Get featured products' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved featured products',
  })
  async getFeaturedProducts(@Query('limit') limit?: string) {
    return this.productsService.getFeaturedProducts(
      limit ? parseInt(limit) : 10,
    );
  }
}
