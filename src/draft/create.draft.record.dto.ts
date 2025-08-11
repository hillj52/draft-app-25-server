import { RosterPosition } from '@prisma/client';
import { IsNumber, IsString } from 'class-validator';

export class CreateDraftRecordDTO {
  @IsNumber() playerId: number;
  @IsNumber() teamId: number;
  @IsNumber() price: number;
  @IsString() position: RosterPosition;
}
