import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const config = new ConfigService();

export const ormConfig: DataSourceOptions = {
  type: config.get('DATABASE_TYPE') as 'postgres', // change "postgres" to database vendor of choice
  ...(config.get('NODE_ENV') === 'production'
    ? { url: config.get('DATABASE_URL') }
    : {
        username: config.get('DATABASE_USER'),
        host: config.get('DATABASE_HOST'),
        password: String(config.get('DATABASE_PASSWORD')),
        port: parseInt(config.get<string>('DATABASE_PORT')!),
        database: String(config.get('DATABASE_NAME')),
      }),
  entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
  synchronize: config.get('DATABASE_SYNC') === 'true',
  logging:
    config.get('NODE_ENV') !== 'production'
      ? ['error', 'migration', 'warn']
      : false,
  migrations: [__dirname + '/../migrations/**{.ts,.js}'],
};

export const AppDataSource = new DataSource(ormConfig);
