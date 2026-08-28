import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '../generated/prisma';
import { AccountsService } from './accounts.service';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { CreateAccountUserDto } from './dto/create-account-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@ApiTags('accounts')
@ApiBearerAuth()
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: QueryAccountsDto) {
    return this.accounts.findAll(query);
  }

  @Post()
  @Roles(Role.ADMIN)
  createWithUser(@Body() dto: CreateAccountUserDto) {
    return this.accounts.createWithUser(dto);
  }

  @Get('mine')
  findMine(@CurrentUser() user: AuthUser) {
    return this.accounts.findMine(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accounts.findOne(id);
  }
}
