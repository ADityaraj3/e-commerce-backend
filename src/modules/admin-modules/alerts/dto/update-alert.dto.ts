import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateAlertDto {
  @ApiPropertyOptional({ description: 'Alert name/title' })
  @IsOptional()
  @IsString()
  alert_name?: string;

  @ApiPropertyOptional({ description: 'Alert description/content' })
  @IsOptional()
  @IsString()
  alert_description?: string;
}
