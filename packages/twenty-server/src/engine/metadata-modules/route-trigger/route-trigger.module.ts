import { Module } from '@nestjs/common';

import { RouteTriggerController } from 'src/engine/metadata-modules/route-trigger/route-trigger.controller';

// Registers the public catch-all route-trigger REST controller.
@Module({
  controllers: [RouteTriggerController],
})
export class RouteTriggerModule {}
