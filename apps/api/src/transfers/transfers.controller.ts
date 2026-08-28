import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@ApiTags('transfers')
@ApiBearerAuth()
@Controller('transfers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TransfersController {
  constructor(private readonly transfers: TransfersService) {}

  @Post()
  create(
    @Body() dto: CreateTransferDto,
    @Headers('x-idempotency-key') idempotencyKey: string,
    @CurrentUser() user: AuthUser,
  ) {
    if (!idempotencyKey) {
      throw new BadRequestException('X-Idempotency-Key header is required');
    }
    return this.transfers.execute(dto, idempotencyKey, user);
  }

  @Get('account/:accountId')
  findByAccount(@Param('accountId') accountId: string) {
    return this.transfers.findByAccount(accountId);
  }
}
