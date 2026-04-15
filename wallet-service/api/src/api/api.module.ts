import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { LedgerModule } from './ledger/ledger.module';
import { TransactionModule } from './transaction/transaction.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UserModule, WalletModule, LedgerModule, TransactionModule, AuthModule],
})
export class ApiModule {}
