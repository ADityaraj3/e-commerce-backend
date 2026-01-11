import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AddProductDto } from './add-product.dto';
import { AIProvider } from 'src/utils/helper.utils';

// DTO for the first API - Parse English to JSON
export class ParseProductTextDto {
  @ApiProperty({
    description: 'Plain English text describing the product to add',
    example:
      'Add a T-shirt of size M and L with colors as red and blue at price 999',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'AI provider to use for parsing',
    enum: AIProvider,
    default: AIProvider.GROQ,
    required: false,
  })
  @IsOptional()
  @IsEnum(AIProvider)
  ai_provider?: AIProvider;

  @ApiProperty({
    description: 'AI model to use (optional, uses default for provider)',
    example: 'gpt-4o-mini',
    required: false,
  })
  @IsOptional()
  @IsString()
  ai_model?: string;
}

// Missing entity details
export class MissingCategoryDto {
  @ApiProperty({ description: 'Category name that needs to be created' })
  category_name: string;

  @ApiProperty({
    description: 'Parent category name (if this is a subcategory)',
    required: false,
  })
  parent_category_name?: string;
}

export class MissingAttributeDto {
  @ApiProperty({ description: 'Attribute name that needs to be created' })
  attribute_name: string;

  @ApiProperty({ description: 'Category name this attribute belongs to' })
  category_name: string;

  @ApiProperty({
    description: 'Attribute type',
    example: 'dropdown',
  })
  attribute_type: string;
}

// Response from AI parsing
export class ParsedProductResponseDto {
  @ApiProperty({
    description: 'Whether parsing was successful',
  })
  success: boolean;

  @ApiProperty({
    description: 'The parsed product object ready for creation',
    required: false,
  })
  product_data?: AddProductDto;

  @ApiProperty({
    description: 'List of missing categories that need to be created',
    type: [MissingCategoryDto],
    required: false,
  })
  missing_categories?: MissingCategoryDto[];

  @ApiProperty({
    description: 'List of missing attributes that need to be created',
    type: [MissingAttributeDto],
    required: false,
  })
  missing_attributes?: MissingAttributeDto[];

  @ApiProperty({
    description:
      'Human-readable message about what is missing or needs confirmation',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description:
      'Whether user confirmation is required to create missing entities',
  })
  requires_confirmation: boolean;

  @ApiProperty({
    description: 'Original text that was parsed',
  })
  original_text: string;

  @ApiProperty({
    description: 'Session ID for tracking the parsing session',
  })
  session_id: string;
}

// DTO for second API - Confirm and create product
export class ConfirmProductCreationDto {
  @ApiProperty({
    description: 'Session ID from the parsing response',
  })
  @IsString()
  @IsNotEmpty()
  session_id: string;

  @ApiProperty({
    description: 'Whether to create missing categories and attributes',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  create_missing_entities?: boolean;

  @ApiProperty({
    description: 'The product data to create (can be modified by user)',
    type: AddProductDto,
  })
  @ValidateNested()
  @Type(() => AddProductDto)
  product_data: AddProductDto;

  @ApiProperty({
    description: 'Missing categories to create',
    type: [MissingCategoryDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissingCategoryDto)
  missing_categories?: MissingCategoryDto[];

  @ApiProperty({
    description: 'Missing attributes to create',
    type: [MissingAttributeDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MissingAttributeDto)
  missing_attributes?: MissingAttributeDto[];
}

// Response for product creation
export class ProductCreationResponseDto {
  @ApiProperty({ description: 'Whether creation was successful' })
  success: boolean;

  @ApiProperty({ description: 'Message describing the result' })
  message: string;

  @ApiProperty({ description: 'Created product ID', required: false })
  product_id?: string;

  @ApiProperty({
    description: 'Created category IDs',
    required: false,
    type: [String],
  })
  created_category_ids?: string[];

  @ApiProperty({
    description: 'Created attribute IDs',
    required: false,
    type: [String],
  })
  created_attribute_ids?: string[];
}
