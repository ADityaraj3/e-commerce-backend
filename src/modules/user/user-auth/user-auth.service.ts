import { BadRequestException, Injectable } from '@nestjs/common';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import * as encryption from 'src/utils/encryption.utlis';
import { Customer, otp_type } from '@prisma/client';
import { LoginSignupMobileDto } from './dto/login-signup-mobile.dto';
import { generateOtp } from 'src/utils/helper.utils';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { OTP_CHANNEL } from 'src/utils/constant';

@Injectable()
export class UserAuthService {
  constructor(private prisma: PrismaService) {}

  async googleAuth(body: GoogleAuthDto) {
    try {
      const user = await this.prisma.customer.findFirst({
        where: {
          email: body.email,
          is_deleted: false,
        },
      });

      let token: string = '';

      if (!user) {
        token = await this.handleGoogleSignUp(body);
      } else {
        token = await this.handleGoogleLogin(user);
      }

      return token;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async handleGoogleSignUp(body: GoogleAuthDto): Promise<string> {
    try {
      const user = await this.prisma.customer.create({
        data: {
          email: body.email,
          first_name: body.first_name,
          last_name: body.last_name,
          last_login: new Date(),
        },
      });

      const token = await encryption.generateAuthToken({
        id: user.customer_id,
        date: new Date(),
      });

      return token;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async handleGoogleLogin(user: Customer): Promise<string> {
    try {
      await this.prisma.customer.update({
        where: {
          customer_id: user.customer_id,
        },
        data: {
          last_login: new Date(),
        },
      });

      const token = await encryption.generateAuthToken({
        id: user.customer_id,
        date: new Date(),
      });

      return token;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async loginSignupMobile(body: LoginSignupMobileDto) {
    try {
      let user = await this.prisma.customer.findFirst({
        where: {
          phone: body.phone,
          is_deleted: false,
        },
      });

      let isLogin = true;
      if (!user) {
        user = await this.prisma.customer.create({
          data: {
            phone: body.phone,
            last_login: new Date(),
          },
        });
        isLogin = false;
      }

      const otp = generateOtp();
      let otpType: otp_type;

      if (body.channel === OTP_CHANNEL.PHONE) {
        otpType = isLogin ? otp_type.MOBILE_LOGIN : otp_type.MOBILE_SIGNUP;
      } else if (body.channel === OTP_CHANNEL.EMAIL) {
        otpType = isLogin ? otp_type.EMAIL_LOGIN : otp_type.EMAIL_SIGNUP;
      } else {
        throw new BadRequestException('Invalid channel');
      }

      const otpResponse = await this.prisma.otp.create({
        data: {
          otp,
          created_for: user.customer_id,
          otp_type: otpType,
        },
      });

      return {
        otp_id: otpResponse.otp_id,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async verifyOtp(body: VerifyOtpDto) {
    try {
      const otpResponse = await this.prisma.otp.findFirst({
        where: {
          otp_id: body.otp_id,
          otp: body.otp,
          is_verified: false,
        },
      });

      if (!otpResponse) {
        throw new BadRequestException('Invalid OTP');
      }

      await this.prisma.otp.update({
        where: {
          otp_id: otpResponse.otp_id,
        },
        data: {
          is_verified: true,
        },
      });

      const token: string = await encryption.generateAuthToken({
        id: otpResponse.created_for,
        date: new Date(),
      });

      return token;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
