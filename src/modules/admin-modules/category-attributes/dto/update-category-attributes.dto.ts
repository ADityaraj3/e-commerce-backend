import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCategoryAttributeDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  category_id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  attribute_name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  attribute_type: string;

  @ApiProperty()
  @IsNotEmpty()
  display_sequence: number;

  @ApiProperty()
  @IsNotEmpty()
  is_required: boolean;
}
