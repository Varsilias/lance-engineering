import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/orm.config';

@Global()
@Module({
  imports: [TypeOrmModule.forRoot(ormConfig)],
  providers: [],
  exports: [],
})
export class DatabaseModule {}
