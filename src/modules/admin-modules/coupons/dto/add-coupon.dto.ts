import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  IsISO8601,
} from 'class-validator';

export class AddCouponsDto {
  @ApiProperty({
    type: Number,
    description: 'description',
    example: 'this is correct description',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  description?: string;

  @ApiProperty({
    type: Number,
    description: 'discount_type',
    example: 'casual',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  discount_type?: string;

  @ApiProperty({
    example: 1000,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  discount_value?: number;

  @ApiProperty({
    example: 100,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  max_uses?: number;

  @ApiProperty({
    example: 5999,
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  min_cart_value?: number;

  @ApiProperty({
    example: '2025-12-31T23:59:59Z',
    description: 'Expected ISO-8601 DateTime with timezone (Z).',
    required: false,
  })
  @IsISO8601({}, { message: 'Expected ISO-8601 DateTime with timezone (Z).' })
  @Type(() => Date)
  expires_at?: Date;

  @ApiProperty({
    example: false,
    required: true,
  })
  @IsNotEmpty()
  @IsBoolean()
  is_active?: boolean;
}
