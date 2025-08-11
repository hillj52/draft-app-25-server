import { Prisma } from '@prisma/client';

export class PlayerEntity {
  id: number;
  name: string;
  team: string;
  position: string;
  price?: number;
  byeWeek: number;
  projPoints?: number;
  drafted: boolean;

  constructor(
    player: Prisma.PlayerGetPayload<{
      include: {
        passProj: true;
        rushProj: true;
        receProj: true;
        projPoints: true;
        position: true;
        bye: true;
      };
    }>,
  );
  constructor(
    player: Prisma.PlayerGetPayload<{
      include: {
        passProj: true;
        rushProj: true;
        receProj: true;
        projPoints: true;
        position: true;
        drafted: true;
        bye: true;
      };
    }>,
  ) {
    this.id = player.id;
    this.name = player.name;
    this.team = player.team;
    this.position = player.position.code;
    this.price = player.drafted?.cost;
    this.byeWeek = player.bye.week;
    this.projPoints = player.projPoints?.points;
    this.drafted = !!player.drafted;
  }
}
