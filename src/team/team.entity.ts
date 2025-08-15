import { Prisma, RosterPosition } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';
import { PlayerEntity } from 'src/player/player.entity';

export class TeamEntity {
  id: number;
  name: string;
  owner: string;
  money: number;

  @Expose({ name: 'qb' })
  getQB1() {
    return this.roster.get('QB');
  }

  @Expose({ name: 'rb1' })
  getRB1() {
    return this.roster.get('RB1');
  }

  @Expose({ name: 'rb2' })
  getRB2() {
    return this.roster.get('RB2');
  }

  @Expose({ name: 'wr1' })
  getWR1() {
    return this.roster.get('WR1');
  }

  @Expose({ name: 'wr2' })
  getWR2() {
    return this.roster.get('WR2');
  }

  @Expose({ name: 'flex' })
  getFLX() {
    return this.roster.get('FLEX');
  }

  @Expose({ name: 'op' })
  getOP() {
    return this.roster.get('OP');
  }

  @Expose({ name: 'te' })
  getTE() {
    return this.roster.get('TE');
  }

  @Expose({ name: 'k ' })
  getK() {
    return this.roster.get('K');
  }

  @Expose({ name: 'dst' })
  getDST() {
    return this.roster.get('DST');
  }

  @Expose({ name: 'bench' })
  getBEN1() {
    const bench: PlayerEntity[] = [];
    this.roster.forEach((player, rosterPos) => {
      if (
        rosterPos == 'BEN1' ||
        rosterPos == 'BEN2' ||
        rosterPos == 'BEN3' ||
        rosterPos == 'BEN4' ||
        rosterPos == 'BEN5' ||
        rosterPos == 'BEN6'
      ) {
        bench.push(player);
      }
    });
    return bench;
  }

  @Exclude()
  roster: Map<RosterPosition, PlayerEntity>;

  constructor(
    team: Prisma.TeamGetPayload<{
      include: {
        roster: {
          include: {
            player: {
              include: {
                position: true;
                projPoints: true;
                passProj: true;
                rushProj: true;
                receProj: true;
                bye: true;
                value: true;
              };
            };
          };
        };
      };
    }>,
  );
  constructor(
    team: Prisma.TeamGetPayload<{
      include: {
        roster: {
          include: {
            player: {
              include: {
                position: true;
                projPoints: true;
                passProj: true;
                rushProj: true;
                receProj: true;
                drafted: true;
                bye: true;
                value: true;
              };
            };
          };
        };
      };
    }>,
  ) {
    this.id = team.id;
    this.owner = team.owner;
    this.name = team.name;
    this.money = team.budgetRemaining;
    this.roster = new Map();
    if (team.roster && team.roster.length > 0) {
      team.roster.forEach((draftRec) => {
        this.roster.set(draftRec.rosterPos, new PlayerEntity(draftRec.player));
      });
    }
  }
}
