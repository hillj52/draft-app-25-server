import { Prisma } from '@prisma/client';
import { PlayerEntity } from 'src/player/player.entity';
import { TeamEntity } from 'src/team/team.entity';

export class DraftRecordEntity {
  team: TeamEntity;
  player: PlayerEntity;

  constructor(
    draftRecord: Prisma.DraftRecordGetPayload<{
      include: {
        player: {
          include: {
            passProj: true;
            rushProj: true;
            receProj: true;
            projPoints: true;
            position: true;
            bye: true;
          };
        };
        team: {
          include: {
            roster: {
              include: {
                player: {
                  include: {
                    passProj: true;
                    rushProj: true;
                    receProj: true;
                    projPoints: true;
                    position: true;
                    bye: true;
                  };
                };
              };
            };
          };
        };
      };
    }>,
  ) {
    this.team = new TeamEntity(draftRecord.team);
    this.player = new PlayerEntity(draftRecord.player);
  }
}
