import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateTransferDto {
  @ApiProperty({ description: 'UUID de la cuenta origen (debe ser del usuario autenticado)' })
  @IsUUID()
  fromAccountId: string;

  @ApiProperty({ description: 'UUID de la cuenta destino' })
  @IsUUID()
  toAccountId: string;

  @ApiProperty({ example: 100, description: 'Monto a transferir (sin comisión)' })
  @IsNumber()
  @IsPositive()
  amount: number;
}
