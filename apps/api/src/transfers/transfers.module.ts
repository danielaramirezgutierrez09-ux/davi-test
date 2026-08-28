import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { AntiFraudService } from './antifraud.service';
import { EventsService } from '../common/events.service';

@Module({
  providers: [TransfersService, AntiFraudService, EventsService],
  controllers: [TransfersController],
  exports: [EventsService],
})
export class TransfersModule {}
