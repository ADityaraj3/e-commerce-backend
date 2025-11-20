import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { AddCouponsDto } from './dto/add-coupon.dto';

@ApiTags('Coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post('create')
  // need to Set admin auth (access Guard)
  createCoupon(
    @Body() dto: AddCouponsDto,
    @Query('admin_id') admin_id: string,
  ) {
    return this.couponsService.createCoupons(dto, admin_id);
  }

  @Get()
  getCoupon() {
    return this.couponsService.getCoupons();
  }
}
