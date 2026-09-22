// Generic get/set/delete service over the key-value-pair table, scoped by
// an optional user id and/or workspace id (undefined = ignore that scope,
// null = require it to be unset), with type-safe values via a caller-
// supplied key-to-value-type map.
import { InjectRepository } from '@nestjs/typeorm';

import { type QueryRunner, IsNull, Repository } from 'typeorm';

import {
  KeyValuePairEntity,
  type KeyValuePairType,
} from 'src/engine/core-modules/key-value-pair/key-value-pair.entity';

export class KeyValuePairService<
  // oxlint-disable-next-line typescript/no-explicit-any
  KeyValueTypesMap extends Record<string, any> = Record<string, any>,
> {
  constructor(
    @InjectRepository(KeyValuePairEntity)
    private readonly keyValuePairRepository: Repository<KeyValuePairEntity>,
  ) {}

  // Finds key-value pairs matching the given scope/type/key, falling back to
  // the deprecated text value column when the JSONB value is unset.
  async get<K extends keyof KeyValueTypesMap>({
    userId,
    workspaceId,
    type,
    key,
  }: {
    userId?: string | null;
    workspaceId?: string | null;
    type: KeyValuePairType;
    key?: Extract<K, string>;
  }): Promise<Array<KeyValueTypesMap[K]>> {
    const keyValuePairs = (await this.keyValuePairRepository.find({
      where: {
        ...(userId === undefined
          ? {}
          : userId === null
            ? { userId: IsNull() }
            : { userId }),
        ...(workspaceId === undefined
          ? {}
          : workspaceId === null
            ? { workspaceId: IsNull() }
            : { workspaceId }),
        ...(key === undefined ? {} : { key }),
        type,
      },
    })) as Array<KeyValueTypesMap[K]>;

    return keyValuePairs.map((keyValuePair) => ({
      ...keyValuePair,
      value: keyValuePair.value ?? keyValuePair.textValueDeprecated,
    }));
  }

  // Upserts a key-value pair, picking the conflict target (and matching
  // partial unique index predicate) based on which of userId/workspaceId
  // are null, so the upsert lands on the correct scoped unique constraint.
  async set<K extends keyof KeyValueTypesMap>(
    {
      userId,
      workspaceId,
      key,
      value,
      type,
    }: {
      userId?: string | null;
      workspaceId?: string | null;
      key: Extract<K, string>;
      value: KeyValueTypesMap[K];
      type: KeyValuePairType;
    },
    queryRunner?: QueryRunner,
  ) {
    const normalizedUserId = userId ?? null;
    const normalizedWorkspaceId = workspaceId ?? null;
    const hasNullUserAndWorkspace =
      normalizedUserId === null && normalizedWorkspaceId === null;
    const keyValuePairRepository = queryRunner
      ? queryRunner.manager.getRepository(KeyValuePairEntity)
      : this.keyValuePairRepository;

    const upsertData = {
      userId: normalizedUserId,
      workspaceId: normalizedWorkspaceId,
      key,
      value,
      type,
    };

    const conflictPaths: string[] = ['key'];
    let indexPredicate: string | undefined;

    if (hasNullUserAndWorkspace) {
      indexPredicate = '"userId" IS NULL AND "workspaceId" IS NULL';
    } else if (normalizedUserId === null) {
      conflictPaths.push('workspaceId');
      indexPredicate = '"userId" IS NULL';
    } else if (normalizedWorkspaceId === null) {
      conflictPaths.push('userId');
      indexPredicate = '"workspaceId" IS NULL';
    } else {
      conflictPaths.push('userId', 'workspaceId');
    }

    await keyValuePairRepository.upsert(upsertData, {
      conflictPaths,
      indexPredicate,
    });
  }

  // Deletes key-value pairs matching the given scope/type/key.
  async delete(
    {
      userId,
      workspaceId,
      type,
      key,
    }: {
      userId?: string | null;
      workspaceId?: string | null;
      type: KeyValuePairType;
      key: Extract<keyof KeyValueTypesMap, string>;
    },
    queryRunner?: QueryRunner,
  ) {
    const deleteConditions = {
      ...(userId === undefined
        ? {}
        : userId === null
          ? { userId: IsNull() }
          : { userId }),
      ...(workspaceId === undefined
        ? {}
        : workspaceId === null
          ? { workspaceId: IsNull() }
          : { workspaceId }),
      type,
      key,
    };

    const { affected } = queryRunner
      ? await queryRunner.manager
          .getRepository(KeyValuePairEntity)
          .delete(deleteConditions)
      : await this.keyValuePairRepository.delete(deleteConditions);

    return affected;
  }
}
