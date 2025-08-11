import { IsNumber } from 'class-validator';

export class DeleteDraftRecordDTO {
  @IsNumber() playerId: number;
  @IsNumber() teamId: number;
}
