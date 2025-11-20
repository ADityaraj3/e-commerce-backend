import { Module } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CouponsController } from './coupons.controller';

@Module({
  providers: [CouponsService],
  controllers: [CouponsController]
})
export class CouponsModule {}
