import { fromEntityToScalarEntity } from 'src/engine/metadata-modules/flat-entity/utils/from-entity-to-scalar-entity.util';
import { type FlatWebhook } from 'src/engine/metadata-modules/flat-webhook/types/flat-webhook.type';
import { type FromEntityToFlatEntityArgs } from 'src/engine/workspace-cache/types/from-entity-to-flat-entity-args.type';
import { resolveManyToOneRelationIdsToUniversalIdentifiers } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/utils/resolve-many-to-one-relation-ids-to-universal-identifiers.util';

// Converts a WebhookEntity into its flat representation, resolving
// many-to-one relation ids (e.g. application) to universal identifiers.
export const fromWebhookEntityToFlatWebhook = (
  args: FromEntityToFlatEntityArgs<'webhook'>,
): FlatWebhook => {
  const { entity: webhookEntity } = args;

  const webhookScalarEntity = fromEntityToScalarEntity({
    metadataName: 'webhook',
    entity: webhookEntity,
  });

  const relationUniversalIdentifiers =
    resolveManyToOneRelationIdsToUniversalIdentifiers({
      metadataName: 'webhook',
      ...args,
    });

  return {
    ...webhookScalarEntity,
    ...relationUniversalIdentifiers,
  };
};
