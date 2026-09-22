import { type SecretEncryptionRotationSiteName } from 'src/database/commands/secret-encryption-rotation/constants/secret-encryption-rotation-site-entries.constant';

export type SecretEncryptionRotationContext = {
  siteName: SecretEncryptionRotationSiteName;
  currentEncryptionKeyId: string;
  batchSize: number;
  dryRun: boolean;
};

export type SecretEncryptionRotationOutcome = {
  rotated: number;
  skipped: number;
  errors: number;
};

export type SecretEncryptionRotationSiteResult =
  SecretEncryptionRotationOutcome & {
    siteName: SecretEncryptionRotationSiteName;
    remainingBefore: number;
    durationMs: number;
  };

// Contract every secret-encryption-rotation site handler implements: report how
// many rows still need rotating, and perform the rotation itself.
export abstract class SecretEncryptionRotationHandler {
  abstract countRemaining(
    args: Pick<
      SecretEncryptionRotationContext,
      'siteName' | 'currentEncryptionKeyId'
    >,
  ): Promise<number>;

  abstract rotate(
    context: SecretEncryptionRotationContext,
  ): Promise<SecretEncryptionRotationOutcome>;
}
