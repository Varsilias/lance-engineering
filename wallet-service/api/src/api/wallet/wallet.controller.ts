import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import {
  DepositFundDto,
  TransactionQueryDto,
  TransferFundDto,
} from './wallet.dto';
import { WalletService } from './wallet.service';
import {
  CurrentUser,
  type IDecoratorUser,
} from '../../commons/decorators/current-admin.decorator';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('deposit')
  async depositFund(
    @Body() depositFundDto: DepositFundDto,
    @CurrentUser() user: IDecoratorUser,
  ) {
    return this.walletService.fundWallet(depositFundDto, user);
  }

  @Post('transfer')
  async transferFund(
    @Body() transferFundDto: TransferFundDto,
    @CurrentUser() user: IDecoratorUser,
  ) {
    return this.walletService.transferMoney(transferFundDto, user);
  }

  @Get('list')
  getWallets(@CurrentUser() user: IDecoratorUser) {
    return this.walletService.getWallets(user);
  }

  @Get(':user_id/transactions')
  getTransactions(
    @Param('user_id') user_id: string,
    @Query() query: TransactionQueryDto,
    @CurrentUser() user: IDecoratorUser,
  ) {
    return this.walletService.getTransactionHistory(user_id, query, user);
  }

  @Get(':user_id/balance')
  getBalance(@Param('user_id') user_id: string) {
    return this.walletService.getBalance(user_id);
  }
}
