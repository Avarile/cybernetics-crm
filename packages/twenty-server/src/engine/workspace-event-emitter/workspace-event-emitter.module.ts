import { Global, Module } from '@nestjs/common';

import { WorkspaceEventEmitter } from 'src/engine/workspace-event-emitter/workspace-event-emitter';

// Global so any feature module can inject WorkspaceEventEmitter without importing this module.
@Global()
@Module({
  providers: [WorkspaceEventEmitter],
  exports: [WorkspaceEventEmitter],
})
export class WorkspaceEventEmitterModule {}
