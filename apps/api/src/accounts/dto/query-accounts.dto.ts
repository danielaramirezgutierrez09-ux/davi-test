import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType } from '@prisma/client';

export class QueryAccountsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit = 10;

  @IsEnum(AccountType)
  @IsOptional()
  type?: AccountType;

  @IsString()
  @IsOptional()
  search?: string;
}
