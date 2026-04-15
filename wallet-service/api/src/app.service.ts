import { Injectable } from '@nestjs/common';
import { ResponseDto } from './commons/utils/response.dto';

@Injectable()
export class AppService {
  getHealth(): ResponseDto {
    return ResponseDto.success(
      'Health check successful',
      {
        message: 'OK',
        timestamp: new Date().toISOString(),
      },
      200,
    );
  }
}
