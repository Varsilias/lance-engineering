import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UserEntity } from '../user/user.entity';
import { WalletEntity } from '../wallet/wallet.entity';
import { SignupDto, LoginDto } from './auth.dto';
import { ResponseDto } from '../../commons/utils/response.dto';
import { User } from '../../commons/decorators/current-admin.decorator';

@Injectable()
export class AuthService {
  constructor(
    private readonly ds: DataSource,

    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    private readonly jwtService: JwtService,
  ) {}

  async register(dto: SignupDto) {
    const { email, password, first_name, last_name } = dto;

    return await this.ds.transaction(async (manager) => {
      const existing = await manager.findOne(UserEntity, {
        where: { email },
      });

      if (existing) {
        throw new BadRequestException('User already exists');
      }

      const password_hash = await bcrypt.hash(password, 10);

      const entity = manager.create(UserEntity, {
        email,
        first_name,
        last_name,
        password: password_hash,
        email_verified_at: new Date(),
      });

      const user = await manager.save(entity);

      const wallet = await manager.save(WalletEntity, {
        user,
      });

      const token = this.jwtService.sign({
        sub: user.id,
      });

      return ResponseDto.success('User created successfully', {
        user,
        wallet,
        access_token: token,
      });
    });
  }

  async login(dto: LoginDto) {
    const { email, password } = dto;

    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      sub: user.id,
    });

    return ResponseDto.success('Login successful', {
      access_token: token,
      user,
    });
  }

  async getProfile(currentUser: User) {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.sub },
    });
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    return ResponseDto.success('Account retrieved succesfully', user);
  }
}
