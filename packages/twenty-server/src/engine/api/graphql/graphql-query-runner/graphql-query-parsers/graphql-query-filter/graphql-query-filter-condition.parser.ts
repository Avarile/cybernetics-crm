// Recursively turns a GraphQL `filter` input (with and/or/not combinators
// plus per-field conditions) into TypeORM WHERE brackets, delegating the
// actual per-field SQL generation to GraphqlQueryFilterFieldParser.
import {
  Brackets,
  NotBrackets,
  type ObjectLiteral,
  type WhereExpressionBuilder,
} from 'typeorm';

import { type ObjectRecordFilter } from 'src/engine/api/graphql/workspace-query-builder/interfaces/object-record.interface';

import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type WorkspaceSelectQueryBuilder } from 'src/engine/twenty-orm/repository/workspace-select-query-builder';

import { GraphqlQueryFilterFieldParser } from './graphql-query-filter-field.parser';

export class GraphqlQueryFilterConditionParser {
  private flatObjectMetadata: FlatObjectMetadata;
  private queryFilterFieldParser: GraphqlQueryFilterFieldParser;

  constructor(
    flatObjectMetadata: FlatObjectMetadata,
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
    flatObjectMetadataMaps?: FlatEntityMaps<FlatObjectMetadata>,
    depth = 0,
  ) {
    this.flatObjectMetadata = flatObjectMetadata;
    this.queryFilterFieldParser = new GraphqlQueryFilterFieldParser(
      this.flatObjectMetadata,
      flatFieldMetadataMaps,
      flatObjectMetadataMaps,
      depth,
    );
  }

  // Entry point: wraps the filter's conditions in a single bracketed WHERE
  // clause added to the query builder. No-op if the filter is empty.
  public parse(
    queryBuilder: WorkspaceSelectQueryBuilder<ObjectLiteral>,
    objectNameSingular: string,
    filter: Partial<ObjectRecordFilter>,
  ): WorkspaceSelectQueryBuilder<ObjectLiteral> {
    if (!filter || Object.keys(filter).length === 0) {
      return queryBuilder;
    }

    return queryBuilder.where(
      new Brackets((qb) => {
        this.applyFilterEntriesToWhereBrackets(
          qb,
          queryBuilder,
          objectNameSingular,
          filter,
        );
      }),
    );
  }

  // Applies each top-level filter key/value pair as a WHERE condition,
  // ANDing them together; exposed publicly so relation sub-filters can
  // reuse it on their own nested bracket. First entry uses .where, the
  // rest .andWhere.
  public applyFilterEntriesToWhereBrackets(
    innerQueryBuilder: WhereExpressionBuilder,
    outerQueryBuilder: WorkspaceSelectQueryBuilder<ObjectLiteral>,
    objectNameSingular: string,
    filter: Partial<ObjectRecordFilter>,
  ): void {
    Object.entries(filter).forEach(([key, value], index) => {
      this.parseKeyFilter(
        innerQueryBuilder,
        outerQueryBuilder,
        objectNameSingular,
        key,
        value,
        index === 0,
      );
    });
  }

  // Dispatches a single filter key: 'and'/'or' recursively combine
  // sub-filters with brackets, 'not' negates a sub-filter, and any other
  // key is treated as a field condition delegated to the field parser.
  private parseKeyFilter(
    queryBuilder: WhereExpressionBuilder,
    outerQueryBuilder: WorkspaceSelectQueryBuilder<ObjectLiteral>,
    objectNameSingular: string,
    key: string,
    // oxlint-disable-next-line typescript/no-explicit-any
    value: any,
    isFirst = false,
  ): void {
    switch (key) {
      case 'and': {
        const andWhereCondition = new Brackets((qb) => {
          value.forEach((filter: ObjectRecordFilter, index: number) => {
            const whereCondition = new Brackets((qb2) => {
              Object.entries(filter).forEach(
                ([subFilterkey, subFilterValue], index) => {
                  this.parseKeyFilter(
                    qb2,
                    outerQueryBuilder,
                    objectNameSingular,
                    subFilterkey,
                    subFilterValue,
                    index === 0,
                  );
                },
              );
            });

            if (index === 0) {
              qb.where(whereCondition);
            } else {
              qb.andWhere(whereCondition);
            }
          });
        });

        if (isFirst) {
          queryBuilder.where(andWhereCondition);
        } else {
          queryBuilder.andWhere(andWhereCondition);
        }
        break;
      }
      case 'or': {
        const orWhereCondition = new Brackets((qb) => {
          value.forEach((filter: ObjectRecordFilter, index: number) => {
            const whereCondition = new Brackets((qb2) => {
              Object.entries(filter).forEach(
                ([subFilterkey, subFilterValue], index) => {
                  this.parseKeyFilter(
                    qb2,
                    outerQueryBuilder,
                    objectNameSingular,
                    subFilterkey,
                    subFilterValue,
                    index === 0,
                  );
                },
              );
            });

            if (index === 0) {
              qb.where(whereCondition);
            } else {
              qb.orWhere(whereCondition);
            }
          });
        });

        if (isFirst) {
          queryBuilder.where(orWhereCondition);
        } else {
          queryBuilder.andWhere(orWhereCondition);
        }

        break;
      }
      case 'not': {
        const notWhereCondition = new NotBrackets((qb) => {
          Object.entries(value).forEach(
            ([subFilterkey, subFilterValue], index) => {
              this.parseKeyFilter(
                qb,
                outerQueryBuilder,
                objectNameSingular,
                subFilterkey,
                subFilterValue,
                index === 0,
              );
            },
          );
        });

        if (isFirst) {
          queryBuilder.where(notWhereCondition);
        } else {
          queryBuilder.andWhere(notWhereCondition);
        }

        break;
      }
      default:
        this.queryFilterFieldParser.parse(
          queryBuilder,
          outerQueryBuilder,
          objectNameSingular,
          key,
          value,
          isFirst,
        );
        break;
    }
  }
}
