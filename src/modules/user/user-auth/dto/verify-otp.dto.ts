import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
export class VerifyOtpDto {
  @ApiProperty({ description: 'The OTP ID associated with the OTP code' })
  @IsString()
  @IsNotEmpty()
  otp_id: string;

  @ApiProperty({ description: 'The OTP code to verify' })
  @IsString()
  @IsNotEmpty()
  otp: string;

  @ApiProperty({
    description: 'The channel used to receive the OTP that is mobile or email',
  })
  @IsString()
  @IsNotEmpty()
  channel: string;
}
