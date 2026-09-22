// The union of every shape a CRUD resolver's output can take, one
// variant per resolver method (documented alongside each case below).
import { IConnection } from 'src/engine/api/graphql/workspace-query-runner/interfaces/connection.interface';
import { IEdge } from 'src/engine/api/graphql/workspace-query-runner/interfaces/edge.interface';
import { IGroupByConnection } from 'src/engine/api/graphql/workspace-query-runner/interfaces/group-by-connection.interface';
import { ObjectRecord } from 'twenty-shared/types';

export type ResolverOutput =
  | ObjectRecord // findOne, createOne, updateOne, deleteOne, destroyOne, restoreOne, mergeMany
  | ObjectRecord[] // createMany, updateMany, deleteMany, destroyMany, restoreMany
  | IConnection<ObjectRecord, IEdge<ObjectRecord>> // findMany
  | IConnection<ObjectRecord, IEdge<ObjectRecord>>[] // findDuplicates
  | IGroupByConnection<ObjectRecord, IEdge<ObjectRecord>>; // groupBy
