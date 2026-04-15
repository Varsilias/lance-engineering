import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class DepositFundDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }) // allows depositing in floating point
  @IsPositive()
  @Min(1)
  @Max(1_000_000_000)
  amount: number;

  @IsOptional()
  @IsString()
  reference?: string;
}

export class TransactionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsDateString()
  cursor?: string;
}

export class TransferFundDto {
  @IsNotEmpty()
  @IsUUID()
  from_account_id: string;

  @IsNotEmpty()
  @IsUUID()
  to_account_id: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(1)
  @Max(1_000_000_000)
  amount: number;

  @IsString()
  reference: string;
}
