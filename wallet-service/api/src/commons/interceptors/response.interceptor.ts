import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ResponseDto } from '../utils/response.dto';
import { toSnakeCaseKeys } from '../utils/snake-case';

export class ResponseInterceptor implements NestInterceptor {
  intercept(ctx: ExecutionContext, next: CallHandler): Observable<any> {
    const res = ctx.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Already wrapped
        if (this.isResponseDto(data)) {
          return this.normalize(data, res.statusCode);
        }

        // Wrap default response
        return ResponseDto.success(
          'ok',
          toSnakeCaseKeys(data),
          res.statusCode ?? 200,
        );
      }),
    );
  }

  private isResponseDto(data: any): boolean {
    return (
      data && typeof data === 'object' && 'status' in data && 'message' in data
    );
  }

  private normalize(data: any, statusCode: number) {
    if (data.data) {
      data.data = toSnakeCaseKeys(data.data);
    }

    if (!data.status_code) {
      data.status_code = statusCode;
    }

    return data;
  }
}
