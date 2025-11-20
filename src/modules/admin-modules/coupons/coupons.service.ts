import {
  BadRequestException,
  Injectable,
  NotAcceptableException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AddCouponsDto } from './dto/add-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  async createCoupons(dto: AddCouponsDto, admin_id: string) {
    try {
      const CheckAdmin = await this.prisma.adminUser.findFirst({
        where: {
          user_id: admin_id,
        },
      });

      if (!CheckAdmin)
        throw new NotAcceptableException('only Admin can create ');
      let codeRandom = this.generateCode();

      while (
        await this.prisma.coupon.findFirst({ where: { code: codeRandom } })
      ) {
        codeRandom = this.generateCode();
      }

      return await this.prisma.coupon.create({
        data: {
          code: codeRandom,
          description: dto.description,
          discount_type: dto.discount_type,
          discount_value: dto.discount_value,
          min_cart_value: dto.min_cart_value,
          max_uses: dto.max_uses,
          expires_at: dto.expires_at,
          is_active: dto.is_active,
          created_by: admin_id,
          updated_by: admin_id,
        },
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException('something went wrong', e);
    }
  }

  async getCoupons() {
    return await this.prisma.coupon.findMany();
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }
}
