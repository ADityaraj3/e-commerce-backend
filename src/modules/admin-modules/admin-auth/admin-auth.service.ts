import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import * as encryption from 'src/utils/encryption.utlis';
import { sendBadRequest } from 'src/utils/reponse-formats/response.utils';

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async adminLogin(adminLoginDto: AdminLoginDto) {
    try {
      const admin = await this.prisma.adminUser.findFirst({
        where: { email: adminLoginDto.email },
      });

      if (!admin) {
        return new BadRequestException('Email does not match');
      }

      const passwordMatch: boolean =
        await encryption.comparePasswordUsingBcrypt(
          adminLoginDto.password,
          admin.password_hash,
        );

      if (!passwordMatch) {
        return new BadRequestException('Password does not match');
      }

      const criteriaForJWT: {
        id: string;
        date: Date;
      } = {
        id: admin.user_id,
        date: new Date(),
      };

      const token: string = await encryption.generateAuthToken(criteriaForJWT);

      return token;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
