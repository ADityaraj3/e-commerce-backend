import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';

// ATTRIBUTE SET FOR AUTO-GENERATION
export class AttributeSetDto {
  @ApiProperty({
    description: 'Attribute ID (e.g., color, size)',
    example: 'color',
  })
  @IsString()
  @IsNotEmpty()
  attribute_id: string;

  @ApiProperty({
    description: 'List of possible values for this attribute',
    example: ['Red', 'Blue'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  values: string[];
}

// MANUAL VARIANT (OPTIONAL)
export class ManualVariantDto {
  @ApiProperty({
    description: 'Price of this variant',
    example: 1299,
  })
  @IsNotEmpty()
  @IsNumber()
  price: number;

  @ApiProperty({
    description: 'Optional discount',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({
    description: 'Optional discounted price',
    example: 999,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discounted_price?: number;

  @ApiProperty({
    description: 'Detailed description of the variant',
    example: 'Red color, medium size',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'SKU (optional if auto_generate is true)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiProperty({
    description: 'Array of attributes assigned to this variant',
    example: [
      { attribute_id: 'color', attribute_value: 'Red' },
      { attribute_id: 'size', attribute_value: 'M' },
    ],
  })
  @ValidateNested({ each: true })
  @Type(() => Attribute)
  attributes: Attribute[];

  @ApiProperty({ required: false })
  @IsOptional()
  media_id?: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  stock_quantity: number;
}

export class Attribute {
  @ApiProperty({
    description: 'Attribute ID',
    example: 'color',
  })
  @IsNotEmpty()
  @IsString()
  attribute_id: string;

  @ApiProperty({
    description: 'Attribute value',
    example: 'Red',
  })
  @IsNotEmpty()
  @IsString()
  attribute_value: string;
}

// MAIN PRODUCT DTO
export class AddProductDto {
  @ApiProperty({
    description: 'Category ID',
    example: 'cat-123',
  })
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'T-Shirt',
  })
  @IsString()
  @IsNotEmpty()
  product_name: string;

  @ApiProperty({
    description: 'Is new arrival',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_new_arrival?: boolean;

  /** Global defaults for auto-generated variants */
  @ApiProperty({
    description: 'Price',
    example: 1299,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  price?: number;

  @ApiProperty({
    description: 'Discount',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discount?: number;

  @ApiProperty({
    description: 'Discounted price',
    example: 999,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  discounted_price?: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 100,
    required: false,
  })
  @IsOptional()
  @IsInt()
  stock_quantity?: number;

  @ApiProperty({
    description: 'Is product refundable',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_product_refundable?: boolean;

  @ApiProperty({
    description: 'Product description',
    example: 'A comfortable cotton T-shirt',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  /** AUTO GENERATION ATTRIBUTES */
  @ApiProperty({
    description: 'Attributes used to auto-generate all combinations',
    type: [AttributeSetDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => AttributeSetDto)
  attributes?: AttributeSetDto[];

  @ApiProperty({
    description: 'Enable automatic combination generation',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  auto_generate?: boolean;

  /** MANUAL VARIANTS */
  @ApiProperty({
    type: [ManualVariantDto],
    required: false,
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ManualVariantDto)
  product_variants?: ManualVariantDto[];
}