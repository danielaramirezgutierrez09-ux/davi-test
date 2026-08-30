import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID, Matches } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'UUID de la cuenta origen (debe ser del usuario autenticado)' })
  @IsUUID()
  fromAccountId: string;

  @ApiProperty({ description: 'UUID o número de cuenta destino (FD-XXXX)', example: 'FD-1002' })
  @Matches(/^(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|FD-\d{4})$/i, {
    message: 'toAccountId debe ser UUID o número de cuenta (FD-XXXX)',
  })
  toAccountId: string;

  @ApiProperty({ example: 100, description: 'Monto a transferir (sin comisión)' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
