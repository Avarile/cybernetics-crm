import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type WebhookEntity } from 'src/engine/metadata-modules/webhook/entities/webhook.entity';

// Flat (denormalized) representation of a WebhookEntity used during workspace metadata diffing.
export type FlatWebhook = FlatEntityFrom<WebhookEntity>;
