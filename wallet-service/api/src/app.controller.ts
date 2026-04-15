import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ResponseDto } from './commons/utils/response.dto';
import { Public } from './commons/decorators/public-request.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getWelcome(): ResponseDto {
    return ResponseDto.success('Welcome to Wallet API Service');
  }

  @Public()
  @Get('/health')
  getHealth() {
    return this.appService.getHealth();
  }
}
