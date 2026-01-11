import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginSignupMobileDto {
  @ApiProperty({ description: "User's phone number" })
  phone: string;

  @ApiProperty({ description: 'Channel for login/signup' })
  @IsNotEmpty()
  @IsString()
  channel: string;

  @ApiProperty({ description: "User's email address" })
  email: string;
}
