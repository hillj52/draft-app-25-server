import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  HttpCode,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private _authService: AuthService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/signup')
  async signup(
    @Body() { email, password }: { email: string; password: string },
  ) {
    return this._authService.signup(email, password);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('signin')
  @HttpCode(200)
  async signin(
    @Body() { email, password }: { email: string; password: string },
  ) {
    return this._authService.signin(email, password);
  }
}
