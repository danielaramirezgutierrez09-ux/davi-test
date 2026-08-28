import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { TransfersModule } from '../transfers/transfers.module';

@Module({
  imports: [TransfersModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
