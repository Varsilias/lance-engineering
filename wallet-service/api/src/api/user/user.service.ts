import {
  ConflictException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './user.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateUserDto } from './user.dto';
import { ResponseDto } from '../../commons/utils/response.dto';
import { WalletEntity } from '../wallet/wallet.entity';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly ds: DataSource,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async createUser(dto: CreateUserDto) {
    const { name } = dto;

    return await this.ds.transaction(async (manager) => {
      const existingUser = await manager.findOne(UserEntity, {
        where: { first_name: name },
      });

      if (existingUser) {
        throw new ConflictException('Account already exists, please login');
      }

      const user = await manager.save(UserEntity, {
        first_name: name,
        email: `${name.toLocaleLowerCase().replaceAll(' ', '_')}@example.com`,
        email_verified_at: new Date(),
      });

      const wallet = await manager.save(WalletEntity, {
        user: user,
      });

      this.logger.log('new user created');
      return ResponseDto.success(
        'Account created successfully, please proceed to fund your wallet',
        { ...user, wallet },
        HttpStatus.OK,
      );
    });
  }
}
