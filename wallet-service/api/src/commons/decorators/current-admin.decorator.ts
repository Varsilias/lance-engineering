import { ExecutionContext, createParamDecorator } from '@nestjs/common';
// import { UserEntity } from '../../api/user/user.entity';

// I only declare this user type because I went with a minimal authorisation and verification process
// which only gives me access to the data retrieved directly from the jwt.verify() process - see line 42 and 43 in "auth.guard.ts"
// in a more sophisticated situation, the type to be used will be the "UserEntity" class which maps directly to the table structure
// of the User Table, the reason is because
// 1. I will NOT only rely on the jwt provided by the user for verification. The access token after being generated and issued
//    to the user will equally be stored in an in-memory storage like Redis. The user provided version will be compared against Redis
//    and only if found we will consider the user provided token to be valid even if we signed in - this helps us deal with timing related attack
//    because we can rely on the TTL of Redis to automatically expire token
// 2. I will also immediately call the database to fetch the latest version of the User's Data in the database. This data will then be passed on to
//    all handlers that required authenticated user data to perform any operation - see line 17-24 in wallet.controller.ts and line 39-43
//    of wallet.service.ts for reference. Also see line 2 & 18 of this file
export type User = {
  sub: string;
};

// export type IDecoratorUser = UserEntity;
export type IDecoratorUser = User;
export const extractUser = (request: any): IDecoratorUser => request['user'];

export const CurrentUser = createParamDecorator(
  (data: any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return data ? extractUser(request)[data] : extractUser(request);
  },
);
