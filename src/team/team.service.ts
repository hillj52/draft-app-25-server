import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamEntity } from './team.entity';

@Injectable()
export class TeamService {
  constructor(private _prisma: PrismaService) {}

  async createTeam(owner: string, name: string): Promise<TeamEntity> {
    const team = await this._prisma.team.create({
      data: { owner, name },
      include: {
        roster: {
          include: {
            player: {
              include: { position: true, projPoints: true },
            },
          },
        },
      },
    });
    return new TeamEntity(team);
  }

  async getTeams(): Promise<TeamEntity[]> {
    const teams = await this._prisma.team.findMany({
      include: {
        roster: {
          include: {
            player: { include: { position: true, projPoints: true } },
          },
        },
      },
    });
    return teams.map((team) => new TeamEntity(team));
  }
}
