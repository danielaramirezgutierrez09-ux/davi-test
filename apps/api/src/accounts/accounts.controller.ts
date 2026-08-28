import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AccountsService } from './accounts.service';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthUser } from '../auth/jwt.strategy';

@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query() query: QueryAccountsDto) {
    return this.accounts.findAll(query);
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
