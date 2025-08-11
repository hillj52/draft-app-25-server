import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { DraftService } from './draft.service';
import { CreateDraftRecordDTO } from './create.draft.record.dto';
import { DeleteDraftRecordDTO } from './delete.draft.record.dto';

@Controller('draft')
export class DraftController {
  constructor(private _draftService: DraftService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post()
  draftPlayer(
    @Body() { teamId, playerId, price, position }: CreateDraftRecordDTO,
  ) {
    return this._draftService.draftPlayer({
      teamId,
      playerId,
      price,
      position,
    });
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/undraft')
  undraftPlayer(@Body() { teamId, playerId }: DeleteDraftRecordDTO) {
    return this._draftService.undraftPlayer({ teamId, playerId });
  }
}
