// Base entity for syncable records that can be locally overridden and
// deactivated without losing the upstream-synced values.
import { Column } from 'typeorm';

import { SyncableEntity } from 'src/engine/workspace-manager/types/syncable-entity.interface';
import { type JsonbProperty } from 'src/engine/workspace-manager/workspace-migration/universal-flat-entity/types/jsonb-property.type';

// Adds per-field overrides and an active flag on top of a syncable entity.
export abstract class OverridableEntity<
  TOverrides = Record<string, unknown>,
> extends SyncableEntity {
  @Column({ type: 'jsonb', nullable: true })
  overrides: JsonbProperty<TOverrides> | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}
