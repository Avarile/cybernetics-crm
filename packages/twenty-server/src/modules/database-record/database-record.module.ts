import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActorModule } from 'src/engine/core-modules/actor/actor.module';
import { ApiKeyModule } from 'src/engine/core-modules/api-key/api-key.module';
import { CacheLockModule } from 'src/engine/core-modules/cache-lock/cache-lock.module';
import { FeatureFlagModule } from 'src/engine/core-modules/feature-flag/feature-flag.module';
import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
import { ThrottlerModule } from 'src/engine/core-modules/throttler/throttler.module';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import { WorkspaceManyOrAllFlatEntityMapsCacheModule } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.module';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { UserRoleModule } from 'src/engine/metadata-modules/user-role/user-role.module';
import { CyberneticsDataCentreClientService } from 'src/modules/database-record/client/cybernetics-data-centre-client.service';
import { DatabaseRecordSnapshotRefreshCronCommand } from 'src/modules/database-record/crons/commands/database-record-snapshot-refresh.cron.command';
import { DatabaseRecordSnapshotRefreshCronJob } from 'src/modules/database-record/crons/jobs/database-record-snapshot-refresh.cron.job';
import { DatabaseRecordSnapshotRefreshJob } from 'src/modules/database-record/jobs/database-record-snapshot-refresh.job';
import { DatabaseConnectionResolver } from 'src/modules/database-record/resolvers/database-connection.resolver';
import { DatabaseRecordResolver } from 'src/modules/database-record/resolvers/database-record.resolver';
import { DatabaseConnectionTokenEncryptionService } from 'src/modules/database-record/services/database-connection-token-encryption.service';
import { DatabaseConnectionService } from 'src/modules/database-record/services/database-connection.service';
import { DatabaseRecordAttachmentService } from 'src/modules/database-record/services/database-record-attachment.service';
import { DatabaseRecordBrowseService } from 'src/modules/database-record/services/database-record-browse.service';
import { DatabaseRecordSnapshotService } from 'src/modules/database-record/services/database-record-snapshot.service';

// Wires up the cybernetics-data-centre integration: the REST client, the
// workspace connection, browse/attach resolvers and the snapshot refresh job.
@Module({
  imports: [
    TypeOrmModule.forFeature([WorkspaceEntity]),
    ActorModule,
    ApiKeyModule,
    CacheLockModule,
    FeatureFlagModule,
    PermissionsModule,
    SecretEncryptionModule,
    SecureHttpClientModule,
    ThrottlerModule,
    UserRoleModule,
    WorkspaceManyOrAllFlatEntityMapsCacheModule,
  ],
  providers: [
    CyberneticsDataCentreClientService,
    DatabaseConnectionTokenEncryptionService,
    DatabaseConnectionService,
    DatabaseRecordBrowseService,
    DatabaseRecordSnapshotService,
    DatabaseRecordAttachmentService,
    DatabaseConnectionResolver,
    DatabaseRecordResolver,
    DatabaseRecordSnapshotRefreshJob,
    DatabaseRecordSnapshotRefreshCronJob,
    DatabaseRecordSnapshotRefreshCronCommand,
  ],
  exports: [
    DatabaseConnectionTokenEncryptionService,
    DatabaseRecordSnapshotRefreshCronCommand,
  ],
})
export class DatabaseRecordModule {}
