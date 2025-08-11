import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private _prisma: PrismaService) {}

  create(email: string, passwordHash: string): Promise<User> {
    return this._prisma.user.create({
      data: { email, password: passwordHash },
    });
  }

  findOne(id: number): Promise<User | null> {
    return this._prisma.user.findUnique({ where: { id } });
  }

  find(email: string): Promise<User | null> {
    return this._prisma.user.findUnique({ where: { email } });
  }
}
