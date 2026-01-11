import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AdminProductService } from './admin-product.service';
import { AddProductDto } from './dto/add-product.dto';
import { AdminAuthGuard } from 'src/utils/guards/admin-auth.guard';
import { UserId } from 'src/utils/decorators';

@Controller('admin-product')
@UseGuards(AdminAuthGuard)
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Post('')
  async addProduct(
    @Body() addProduct: AddProductDto,
    @UserId() userId: string,
  ) {
    return this.adminProductService.addProduct(addProduct, userId);
  }
}
