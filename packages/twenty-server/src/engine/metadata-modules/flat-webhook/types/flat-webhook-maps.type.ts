import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatWebhook } from 'src/engine/metadata-modules/flat-webhook/types/flat-webhook.type';

// Denormalized, id/universal-identifier indexed collection of all flat webhooks in a workspace.
export type FlatWebhookMaps = FlatEntityMaps<FlatWebhook>;
