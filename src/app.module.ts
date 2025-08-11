import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PlayerModule } from './player/player,module';
import { TeamModule } from './team/team.module';
import { DraftModule } from './draft/draft.module';

@Module({
  imports: [AuthModule, PrismaModule, PlayerModule, TeamModule, DraftModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
