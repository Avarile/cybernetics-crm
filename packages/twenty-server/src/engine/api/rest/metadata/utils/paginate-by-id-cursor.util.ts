import { BadRequestException } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';
import {
  type FindManyOptions,
  type FindOptionsWhere,
  LessThan,
  MoreThan,
  type Repository,
} from 'typeorm';

// Pagination info for the id-cursor pagination used by REST metadata
// endpoints.
export type RestCursorPageInfo = {
  hasNextPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

// Cursor-paginates a TypeORM repository query by descending/ascending id,
// using a workspace-scoped where clause plus optional startingAfter/
// endingBefore id cursors; throws if both cursors are given together.
export const paginateByIdCursor = async <
  T extends { id: string; workspaceId: string },
>({
  repository,
  workspaceId,
  where,
  limit,
  startingAfter,
  endingBefore,
}: {
  repository: Repository<T>;
  workspaceId: string;
  where?: FindOptionsWhere<T>;
  limit: number;
  startingAfter?: string;
  endingBefore?: string;
}): Promise<{
  items: T[];
  pageInfo: RestCursorPageInfo;
  totalCount: number;
}> => {
  if (isDefined(startingAfter) && isDefined(endingBefore)) {
    throw new BadRequestException(
      `'starting_after' and 'ending_before' cannot be used together.`,
    );
  }

  const isBackward = isDefined(endingBefore);

  const idCondition = isBackward
    ? { id: MoreThan(endingBefore) }
    : isDefined(startingAfter)
      ? { id: LessThan(startingAfter) }
      : {};

  const baseWhere = { ...where, workspaceId } as FindOptionsWhere<T>;

  const [rows, totalCount] = await Promise.all([
    repository.find({
      where: { ...baseWhere, ...idCondition },
      order: { id: isBackward ? 'ASC' : 'DESC' },
      take: limit + 1,
    } as FindManyOptions<T>),
    repository.count({ where: baseWhere }),
  ]);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;

  if (isBackward) {
    items.reverse();
  }

  return {
    items,
    pageInfo: {
      hasNextPage: hasMore,
      startCursor: items[0]?.id ?? null,
      endCursor: items[items.length - 1]?.id ?? null,
    },
    totalCount,
  };
};
