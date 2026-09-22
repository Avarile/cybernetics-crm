import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type ApplicationVariableEntity } from 'src/engine/core-modules/application/application-variable/application-variable.entity';

// Flat (denormalized) representation of an ApplicationVariableEntity used during workspace metadata diffing.
export type FlatApplicationVariable = FlatEntityFrom<ApplicationVariableEntity>;
