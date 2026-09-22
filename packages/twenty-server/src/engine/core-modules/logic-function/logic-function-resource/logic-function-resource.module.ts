// NestJS module providing the logic-function source/built-code storage service.
import { Module } from '@nestjs/common';

import { LogicFunctionResourceService } from 'src/engine/core-modules/logic-function/logic-function-resource/logic-function-resource.service';

@Module({
  providers: [LogicFunctionResourceService],
  exports: [LogicFunctionResourceService],
})
export class LogicFunctionResourceModule {}
