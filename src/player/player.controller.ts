import {
  ClassSerializerInterceptor,
  Controller,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { PlayerService } from './player.service';
import { PlayerEntity } from './player.entity';

@Controller('players')
export class PlayerController {
  constructor(private _playerService: PlayerService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  async getPlayers(): Promise<PlayerEntity[]> {
    return await this._playerService.getAllPlayers();
  }
}
