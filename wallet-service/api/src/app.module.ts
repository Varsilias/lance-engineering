import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseInterceptor } from './commons/interceptors/response.interceptor';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './commons/utils/env';
import { RequestLoggerMiddleware } from './commons/middlewares/request-logger.middleware';
import { DatabaseModule } from './database/database.module';
import { ApiModule } from './api/api.module';
import { UserModule } from './api/user/user.module';
import { AuthModule } from './api/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
      validationOptions: {
        allowUnknown: true, // Prevent unknown keys in environment
        abortEarly: true, // Stop validation on the first error
      },
    }),
    UserModule,
    AuthModule,
    DatabaseModule,
    ApiModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
