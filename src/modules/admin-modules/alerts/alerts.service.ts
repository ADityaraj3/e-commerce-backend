import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateAlertDto } from 'src/modules/admin-modules/alerts/dto/create-alert.dto';
import { UpdateAlertDto } from 'src/modules/admin-modules/alerts/dto/update-alert.dto';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAlertDto, userId: string) {
    try {
      const alert = await this.prisma.alert.create({
        data: {
          alert_name: dto.alert_name,
          alert_description: dto.alert_description,
          created_by: userId,
          updated_by: userId,
        },
      });
      return alert;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findAll() {
    try {
      return await this.prisma.alert.findMany({
        orderBy: { created_at: 'desc' },
      });
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findOne(alert_id: string) {
    try {
      const alert = await this.prisma.alert.findUnique({
        where: { alert_id },
      });
      if (!alert) {
        throw new NotFoundException('Alert not found');
      }
      return alert;
    } catch (error) {
      throw error;
    }
  }

  async update(alert_id: string, dto: UpdateAlertDto, userId: string) {
    try {
      const exists = await this.prisma.alert.findUnique({
        where: { alert_id },
      });
      if (!exists) throw new NotFoundException('Alert not found');

      return await this.prisma.alert.update({
        where: { alert_id },
        data: {
          alert_name: dto.alert_name,
          alert_description: dto.alert_description,
          updated_by: userId,
          updated_at: new Date(),
        },
      });
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error.message);
    }
  }

  async remove(alert_id: string) {
    try {
      const exists = await this.prisma.alert.findUnique({
        where: { alert_id },
      });
      if (!exists) throw new NotFoundException('Alert not found');

      return await this.prisma.alert.delete({ where: { alert_id } });
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error.message);
    }
  }
}
