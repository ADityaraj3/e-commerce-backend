import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Google ID token',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MjYwMjQwNjQwNjQtY2FhY2...',
  })
  id_token: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    description: 'User email address',
    example: 'user@gmail.com',
  })
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  first_name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  last_name?: string;
}
