import { Module } from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import { UserAuthController } from './user-auth.controller';

@Module({
  providers: [UserAuthService],
  controllers: [UserAuthController],
})
export class UserAuthModule {}
