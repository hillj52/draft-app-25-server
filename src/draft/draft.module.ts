import { Module } from '@nestjs/common';
import { DraftService } from './draft.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DraftController } from './draft.controller';

@Module({
  providers: [DraftService],
  imports: [PrismaModule],
  controllers: [DraftController],
})
export class DraftModule {}
