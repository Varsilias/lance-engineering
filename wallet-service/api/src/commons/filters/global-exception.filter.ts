import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ResponseDto } from '../utils/response.dto';
import { toSnakeCaseKeys } from '../utils/snake-case';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const response =
      exception instanceof HttpException ? exception.getResponse() : null;

    // If already structured like ResponseDto → pass through
    if (this.isResponseDto(response)) {
      return res.status(status).json(this.normalize(response, status));
    }

    // Handle timeout / retryable errors
    if (this.isTimeout(exception)) {
      return res
        .status(HttpStatus.GATEWAY_TIMEOUT)
        .json(
          ResponseDto.failure(
            'retryable_downstream_failure',
            toSnakeCaseKeys({ code: 'TIMEOUT' }),
            HttpStatus.GATEWAY_TIMEOUT,
          ),
        );
    }

    // Default error wrapper
    const message =
      typeof response === 'object'
        ? (response as any)?.message
        : exception?.message;

    return res
      .status(status)
      .json(
        ResponseDto.failure(
          this.formatMessage(message),
          toSnakeCaseKeys(response ?? {}),
          status,
        ),
      );
  }

  private isResponseDto(data: any): boolean {
    return (
      data && typeof data === 'object' && 'status' in data && 'message' in data
    );
  }

  private normalize(data: any, status: number) {
    if (data.data) {
      data.data = toSnakeCaseKeys(data.data);
    }

    if (!data.status_code) {
      data.status_code = status;
    }

    return data;
  }

  private isTimeout(exception: any): boolean {
    return (
      exception?.code === 'ETIMEDOUT' ||
      exception?.code === 'ECONNABORTED' ||
      exception?.message?.toUpperCase().includes('TIMEOUT')
    );
  }

  private formatMessage(message: string) {
    return (message || 'error').toLowerCase().replace(/\s+/g, '_');
  }
}
