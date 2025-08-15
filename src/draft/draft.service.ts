import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateDraftRecordDTO } from './create.draft.record.dto';
import { DraftRecordEntity } from './draft.record.entity';
import { DeleteDraftRecordDTO } from './delete.draft.record.dto';
import { RosterPosition } from '@prisma/client';

@Injectable()
export class DraftService {
  constructor(private _prisma: PrismaService) {}

  public async draftPlayer({
    playerId,
    teamId,
    price,
    position,
  }: CreateDraftRecordDTO): Promise<DraftRecordEntity> {
    if ((position as string) == 'BENCH') {
      const bench = await this._prisma.draftRecord.findMany({
        where: {
          teamId,
          rosterPos: {
            in: [
              RosterPosition.BEN1,
              RosterPosition.BEN2,
              RosterPosition.BEN3,
              RosterPosition.BEN4,
              RosterPosition.BEN5,
              RosterPosition.BEN6,
            ],
          },
        },
      });
      if (bench.length >= 6) {
        throw new BadRequestException('Bench is full');
      }
      position = `BEN${bench.length + 1}` as RosterPosition;
    }
    const existingRecord = await this._prisma.draftRecord.findFirst({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: { rosterPos: position, teamId },
    });
    if (existingRecord) {
      throw new BadRequestException('Draft record already exists');
    }
    const id = await this._prisma.$transaction(async (tx) => {
      const budget = await tx.team.findUnique({
        where: { id: teamId },
        select: { budgetRemaining: true },
      });
      if (!budget) {
        throw new BadRequestException('Team not found');
      }
      if (budget.budgetRemaining < price) {
        throw new BadRequestException('Not enough budget remaining');
      }
      const { id } = await tx.draftRecord.create({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: { teamId, playerId, cost: price, rosterPos: position },
      });
      await tx.team.update({
        where: { id: teamId },
        data: { budgetRemaining: budget.budgetRemaining - price },
      });
      return id;
    });
    return this.getDraftRecordById(id);
  }

  public async getDraftRecordById(id: number): Promise<DraftRecordEntity> {
    const record = await this._prisma.draftRecord.findUnique({
      where: { id },
      include: {
        player: {
          include: {
            passProj: true,
            rushProj: true,
            receProj: true,
            projPoints: true,
            position: true,
            bye: true,
            value: true,
            drafted: true,
          },
        },
        team: {
          include: {
            roster: {
              include: {
                player: {
                  include: {
                    passProj: true,
                    rushProj: true,
                    receProj: true,
                    projPoints: true,
                    position: true,
                    bye: true,
                    value: true,
                    drafted: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!record) {
      throw new NotFoundException('No record found');
    }
    return new DraftRecordEntity(record);
  }

  public async undraftPlayer({
    playerId,
    teamId,
  }: DeleteDraftRecordDTO): Promise<boolean> {
    return await this._prisma.$transaction(async (tx) => {
      const existingRecord = await tx.draftRecord.findUnique({
        where: { teamId, playerId },
      });
      if (!existingRecord) {
        throw new BadRequestException('Draft record not found!');
      }
      const team = await tx.team.findUnique({
        where: { id: teamId },
        select: { budgetRemaining: true },
      });
      if (!team) {
        throw new BadRequestException('Team not found!');
      }
      const deleteRecord = await tx.draftRecord.delete({
        where: { teamId, playerId },
      });
      await tx.team.update({
        where: { id: teamId },
        data: { budgetRemaining: team.budgetRemaining + existingRecord.cost },
      });
      return !!deleteRecord;
    });
  }
}
