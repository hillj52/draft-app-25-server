import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { promisify } from 'util';
import { UserEntity } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(
    private _userService: UserService,
    private _jwtService: JwtService,
  ) {}

  async signup(email: string, password: string): Promise<UserEntity> {
    const existingUser = await this._userService.find(email);
    if (existingUser) {
      throw new BadRequestException(`Email: ${email} already in use`);
    }
    const salt = randomBytes(16).toString('hex');
    const hash = await this._hashPassword(password, salt);
    const result = `${hash}.${salt}`;

    const user = await this._userService.create(email, result);

    const entity = new UserEntity(user);
    entity.access_token = await this._createAccesToken(user);
    return entity;
  }

  async signin(email: string, password: string): Promise<UserEntity> {
    const user = await this._userService.find(email);
    if (!user) {
      throw new NotFoundException('Invaild Email/Password');
    }
    const [storedHash, salt] = user.password.split('.');
    const hash = await this._hashPassword(password, salt);

    if (storedHash !== hash) {
      throw new BadRequestException('Invalid Email/Password');
    }

    const entity = new UserEntity(user);
    entity.access_token = await this._createAccesToken(user);
    return entity;
  }

  private async _hashPassword(password: string, salt: string): Promise<string> {
    const hash = (await scrypt(password, salt, 32)) as Buffer;
    return hash.toString('hex');
  }

  private _createAccesToken(user: User): Promise<string> {
    return this._jwtService.signAsync({ sub: user.id, email: user.email });
  }
}
