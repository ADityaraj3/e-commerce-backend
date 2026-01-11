import { Body, Controller, Post } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginSignupMobileDto } from './dto/login-signup-mobile.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('user-auth')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('google-auth')
  @ApiOperation({ summary: 'Authenticate with Google token from frontend' })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated with Google',
  })
  async googleAuth(@Body() body: GoogleAuthDto) {
    return this.userAuthService.googleAuth(body);
  }

  @Post('login-signup-otp')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in',
  })
  async loginSignupMobile(@Body() body: LoginSignupMobileDto) {
    return this.userAuthService.loginSignupMobile(body);
  }

  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP' })
  @ApiResponse({
    status: 200,
    description: 'Successfully verified OTP',
  })
  async verifyOtp(@Body() body: VerifyOtpDto) {
    return this.userAuthService.verifyOtp(body);
  }
}
