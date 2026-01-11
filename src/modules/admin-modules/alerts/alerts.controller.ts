import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from 'src/modules/admin-modules/alerts/alerts.service';
import { CreateAlertDto } from 'src/modules/admin-modules/alerts/dto/create-alert.dto';
import { UpdateAlertDto } from 'src/modules/admin-modules/alerts/dto/update-alert.dto';
import { AdminAuthGuard } from 'src/utils/guards/admin-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserId } from 'src/utils/decorators';

@ApiTags('Alerts')
@Controller('alerts')
@UseGuards(AdminAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  create(@Body() dto: CreateAlertDto, @UserId() userId: string) {
    return this.alertsService.create(dto, userId);
  }

  @Get()
  findAll() {
    return this.alertsService.findAll();
  }

  @Get(':alert_id')
  findOne(@Param('alert_id') alert_id: string) {
    return this.alertsService.findOne(alert_id);
  }

  @Patch(':alert_id')
  update(
    @Param('alert_id') alert_id: string,
    @Body() dto: UpdateAlertDto,
    @UserId() userId: string,
  ) {
    return this.alertsService.update(alert_id, dto, userId);
  }

  @Delete(':alert_id')
  remove(@Param('alert_id') alert_id: string) {
    return this.alertsService.remove(alert_id);
  }
}
