import { Module } from '@nestjs/common';

import { SecretEncryptionModule } from 'src/engine/core-modules/secret-encryption/secret-encryption.module';
import { ConnectedAccountTokenEncryptionService } from 'src/engine/metadata-modules/connected-account/services/connected-account-token-encryption.service';

// Wires up the service that encrypts/decrypts connected account secrets.
@Module({
  imports: [SecretEncryptionModule],
  providers: [ConnectedAccountTokenEncryptionService],
  exports: [ConnectedAccountTokenEncryptionService],
})
export class ConnectedAccountTokenEncryptionModule {}
