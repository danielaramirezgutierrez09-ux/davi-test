import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { AccountType } from '../../generated/prisma';

export class CreateAccountUserDto {
  @ApiProperty({ example: 'Carla Ruiz' })
  @IsString()
  @MinLength(3)
  fullName!: string;

  @ApiProperty({ example: 'carla@findash.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ enum: AccountType, example: AccountType.PREMIUM })
  @IsEnum(AccountType)
  type!: AccountType;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialBalance?: number;
}
