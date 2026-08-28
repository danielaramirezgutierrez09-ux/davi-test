import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @IsUUID()
  fromAccountId: string;

  @IsUUID()
  toAccountId: string;

  @IsNumber()
  @IsPositive()
  amount: number;
}
