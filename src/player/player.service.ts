import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlayerEntity } from './player.entity';

@Injectable()
export class PlayerService {
  private readonly logger = new Logger(PlayerService.name);

  constructor(private _prisma: PrismaService) {}

  public async getAllPlayers(): Promise<PlayerEntity[]> {
    const players = await this._prisma.player.findMany({
      include: {
        passProj: true,
        rushProj: true,
        receProj: true,
        bye: true,
        position: true,
        drafted: true,
        projPoints: true,
        value: true,
      },
      orderBy: {
        projPoints: {
          points: 'desc',
        },
      },
    });
    return players.map((player) => new PlayerEntity(player));
  }

  public async getPlayerById(playerId: number): Promise<PlayerEntity | null> {
    const player = await this._prisma.player.findUnique({
      where: { id: playerId },
      include: {
        passProj: true,
        rushProj: true,
        receProj: true,
        bye: true,
        position: true,
        drafted: true,
        projPoints: true,
        value: true,
      },
    });
    if (!player) {
      return null;
    }
    return new PlayerEntity(player);
  }

  public async getPlayerByNameAndTeam(
    name: string,
    team: string,
  ): Promise<PlayerEntity | null> {
    const player = await this._prisma.player.findUnique({
      where: { name_team: { name, team } },
      include: {
        passProj: true,
        rushProj: true,
        receProj: true,
        bye: true,
        position: true,
        drafted: true,
        projPoints: true,
        value: true,
      },
    });
    if (!player) {
      return null;
    }
    return new PlayerEntity(player);
  }

  async insertPlayer(name: string, team: string, position: string) {
    const pos = await this._prisma.position.findFirst({
      where: { code: position },
    });
    if (!pos) {
      this.logger.error('Invalid position code:', position);
      throw new Error(`Invalid position code ${position}`);
    }
    const playerExists = await this.getPlayerByNameAndTeam(name, team);
    if (playerExists) {
      this.logger.debug('Attempted to insert existing player:', playerExists);
      return playerExists;
    }
    return this._prisma.player.create({
      data: { name, team, positionId: pos.id },
      include: { position: true },
    });
  }
}
