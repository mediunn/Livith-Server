import { Module } from '@nestjs/common';
import { OpenapiService } from './openapi.service';

@Module({
  providers: [OpenapiService]
})
export class OpenapiModule {}
