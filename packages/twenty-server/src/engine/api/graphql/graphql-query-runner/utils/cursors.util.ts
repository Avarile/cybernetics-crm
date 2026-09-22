// Encodes/decodes base64 pagination cursors: a cursor carries the
// record's id plus the values of whatever fields it was ordered by, so
// keyset pagination can resume from that exact position.
import { type ObjectRecord } from 'twenty-shared/types';
import { isDefined, isPlainObject } from 'twenty-shared/utils';

import { type ObjectRecordOrderBy } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';
import { type FindManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import {
  CommonQueryRunnerException,
  CommonQueryRunnerExceptionCode,
} from 'src/engine/api/common/common-query-runners/errors/common-query-runner.exception';
import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';
import { isCompositeFieldMetadataType } from 'src/engine/metadata-modules/field-metadata/utils/is-composite-field-metadata-type.util';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { buildFieldMapsFromFlatObjectMetadata } from 'src/engine/metadata-modules/flat-field-metadata/utils/build-field-maps-from-flat-object-metadata.util';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

export interface CursorData {
  // oxlint-disable-next-line typescript/no-explicit-any
  [key: string]: any;
}

// Decodes a base64 cursor string back into its underlying field values,
// throwing an INVALID_CURSOR exception if it isn't valid base64 JSON.
export const decodeCursor = <T = CursorData>(cursor: string): T => {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString());
  } catch {
    throw new CommonQueryRunnerException(
      `Invalid cursor: ${cursor}`,
      CommonQueryRunnerExceptionCode.INVALID_CURSOR,
      { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
    );
  }
};

// Builds a cursor for a record from the fields it was ordered by (plus
// its id as a tiebreaker), expanding composite fields to only the
// sub-fields actually used in the orderBy.
export const encodeCursor = <T extends ObjectRecord = ObjectRecord>({
  objectRecord,
  order,
  flatObjectMetadata,
  flatFieldMetadataMaps,
}: {
  objectRecord: T;
  order: ObjectRecordOrderBy | undefined;
  flatObjectMetadata: FlatObjectMetadata;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
}): string => {
  const { fieldIdByName } = buildFieldMapsFromFlatObjectMetadata(
    flatFieldMetadataMaps,
    flatObjectMetadata,
  );

  // oxlint-disable-next-line typescript/no-explicit-any
  const orderByValues: Record<string, any> = {};

  for (const orderByEntry of order ?? []) {
    for (const [key, value] of Object.entries(orderByEntry)) {
      const fieldMetadataId = fieldIdByName[key];
      const fieldMetadata = findFlatEntityByIdInFlatEntityMaps({
        flatEntityMaps: flatFieldMetadataMaps,
        flatEntityId: fieldMetadataId,
      });

      if (!isDefined(fieldMetadata)) {
        continue;
      }

      if (
        isCompositeFieldMetadataType(fieldMetadata.type) &&
        isPlainObject(value) &&
        isDefined(value)
      ) {
        const compositeOrderByKeys = Object.keys(
          value as Record<string, unknown>,
        );
        const existingCompositeValue: Record<string, unknown> =
          orderByValues[key] ?? {};
        const recordCompositeValue = objectRecord[key] as
          | Record<string, unknown>
          | null
          | undefined;

        for (const subKey of compositeOrderByKeys) {
          existingCompositeValue[subKey] = recordCompositeValue?.[subKey];
        }

        orderByValues[key] = existingCompositeValue;
      } else {
        orderByValues[key] = objectRecord[key];
      }
    }
  }

  const cursorData: CursorData = {
    ...orderByValues,
    id: objectRecord.id,
  };

  return encodeCursorData(cursorData);
};

// Base64-encodes a cursor data object into an opaque cursor string.
export const encodeCursorData = (cursorData: CursorData) => {
  return Buffer.from(JSON.stringify(cursorData)).toString('base64');
};

// Decodes whichever of `after`/`before` was provided on a find-many
// query's pagination args, or returns undefined if neither was given.
export const getCursor = (
  // oxlint-disable-next-line typescript/no-explicit-any
  args: FindManyResolverArgs<any, any>,
  // oxlint-disable-next-line typescript/no-explicit-any
): Record<string, any> | undefined => {
  if (args.after) return decodeCursor(args.after);
  if (args.before) return decodeCursor(args.before);

  return undefined;
};

// Derives hasNextPage/hasPreviousPage from fetching one extra record
// beyond the requested limit (the classic "limit+1" pagination trick).
export const getPaginationInfo = (
  objectRecords: ObjectRecord[],
  limit: number,
  isForwardPagination: boolean,
) => {
  const hasMoreRecords = objectRecords.length > limit;

  return {
    hasNextPage: isForwardPagination && hasMoreRecords,
    hasPreviousPage: !isForwardPagination && hasMoreRecords,
    hasMoreRecords,
  };
};
