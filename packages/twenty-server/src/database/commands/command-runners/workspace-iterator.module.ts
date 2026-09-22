import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

// Provides WorkspaceIteratorService to any module whose CLI commands need to
// iterate over workspaces.
@Module({
  imports: [TypeOrmModule.forFeature([WorkspaceEntity])],
  providers: [WorkspaceIteratorService],
  exports: [WorkspaceIteratorService],
})
export class WorkspaceIteratorModule {}
