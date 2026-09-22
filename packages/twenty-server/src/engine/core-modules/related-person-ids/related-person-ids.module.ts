// NestJS module exposing RelatedPersonIdsService, used to resolve which CRM
// people are related to an arbitrary record (for timeline calendar/message queries).
import { Module } from '@nestjs/common';

import { RelatedPersonIdsService } from 'src/engine/core-modules/related-person-ids/services/related-person-ids.service';
import { WorkspaceCacheModule } from 'src/engine/workspace-cache/workspace-cache.module';

@Module({
  imports: [WorkspaceCacheModule],
  providers: [RelatedPersonIdsService],
  exports: [RelatedPersonIdsService],
})
export class RelatedPersonIdsModule {}
