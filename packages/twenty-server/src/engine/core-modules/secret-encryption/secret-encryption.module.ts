import { Module } from '@nestjs/common';

import { SecretEncryptionService } from 'src/engine/core-modules/secret-encryption/secret-encryption.service';

// Wires up the service that encrypts/decrypts secrets at rest
@Module({
  providers: [SecretEncryptionService],
  exports: [SecretEncryptionService],
})
export class SecretEncryptionModule {}
