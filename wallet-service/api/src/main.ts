import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import {
  ClassSerializerInterceptor,
  HttpException,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ValidationError } from 'class-validator';
import { ResponseDto } from './commons/utils/response.dto';
import { toSnakeCaseKeys } from './commons/utils/snake-case';
import { formatValidationErrors } from './commons/utils/format-validation-errors';
import { GlobalExceptionsFilter } from './commons/filters/global-exception.filter';

async function bootstrap() {
  const config = new ConfigService();

  const serviceName =
    config.get<string>('SERVICE_NAME') || 'wallet-service-api';

  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: '*', // limit to our frontend IP or DNS name in production
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      stopAtFirstError: false,
      transformOptions: {
        enableImplicitConversion: false,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const formatted = formatValidationErrors(errors);

        // Format validation errors and convert to snake_case
        const body = ResponseDto.failure(
          'validation_error',
          toSnakeCaseKeys({ errors: formatted }),
          422,
        ) as Record<string, any>;

        return new HttpException(body, 422);
      },
    }),
  );

  const logger = new Logger('APP');

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalFilters(new GlobalExceptionsFilter());
  await app.listen(config.get<number>('PORT')!, () => {
    logger.log(
      `${serviceName} Service is running on ${config.get('NODE_ENV')} environment in port ${config.get('PORT')}`,
    );
  });
}
void bootstrap();
