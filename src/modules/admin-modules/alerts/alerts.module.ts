import { Module } from '@nestjs/common';
import { AlertsService } from 'src/modules/admin-modules/alerts/alerts.service';
import { AlertsController } from 'src/modules/admin-modules/alerts/alerts.controller';
import { PrismaModule } from 'src/modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlertsController],
  providers: [AlertsService],
})
export class AlertsModule {}
