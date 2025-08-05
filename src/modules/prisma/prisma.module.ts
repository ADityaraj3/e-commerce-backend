import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Makes the module globally available (no need to import everywhere)
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
