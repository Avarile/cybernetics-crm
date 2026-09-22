// Builders for the OpenAPI 200/201 success response schemas for every
// generated REST endpoint (find/create/update/delete many/one, restore,
// merge, group-by, duplicates, and the schema-document response itself).
import { capitalize } from 'twenty-shared/utils';

import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';

// Response for find-many: a page of records plus pageInfo/totalCount.
export const getFindManyResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular' | 'namePlural'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [item.namePlural]: {
                  type: 'array',
                  items: {
                    $ref: schemaRef,
                  },
                },
              },
            },
            pageInfo: {
              type: 'object',
              properties: {
                hasNextPage: { type: 'boolean' },
                startCursor: {
                  type: 'string',
                },
                endCursor: {
                  type: 'string',
                },
              },
            },
            totalCount: {
              type: 'integer',
            },
          },
        },
      },
    },
  };
};

// Response for find-one: a single record under its singular name.
export const getFindOneResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(item.nameSingular)}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [item.nameSingular]: {
                  $ref: schemaRef,
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for restore-one: the restored record under `restore<Name>`.
export const getRestoreOneResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(item.nameSingular)}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`restore${capitalize(item.nameSingular)}`]: {
                  $ref: schemaRef,
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for restore-many: the restored records under `restore<Names>`.
export const getRestoreManyResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular' | 'namePlural'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`restore${capitalize(item.namePlural)}`]: {
                  type: 'array',
                  items: {
                    $ref: schemaRef,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for create-one: the created record, key varies (`create<Name>`
// vs `createOne<Name>`) between the core and metadata APIs.
export const getCreateOneResponse201 = (
  item: Pick<FlatObjectMetadata, 'nameSingular'>,
  fromMetadata = false,
) => {
  const one = fromMetadata ? 'One' : '';

  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`create${one}${capitalize(item.nameSingular)}`]: {
                  $ref: schemaRef,
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for create-many: the created records under `create<Names>`.
export const getCreateManyResponse201 = (
  item: Pick<FlatObjectMetadata, 'nameSingular' | 'namePlural'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`create${capitalize(item.namePlural)}`]: {
                  type: 'array',
                  items: {
                    $ref: schemaRef,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for update-one: the updated record, key varies (`update<Name>`
// vs `updateOne<Name>`) between the core and metadata APIs.
export const getUpdateOneResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular'>,
  fromMetadata = false,
) => {
  const one = fromMetadata ? 'One' : '';
  const schemaRef = `#/components/schemas/${capitalize(item.nameSingular)}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`update${one}${capitalize(item.nameSingular)}`]: {
                  $ref: schemaRef,
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for delete-many: the deleted records' ids under `delete<Names>`.
export const getDeleteManyResponse200 = (
  item: Pick<FlatObjectMetadata, 'namePlural'>,
) => {
  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`delete${capitalize(item.namePlural)}`]: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'string',
                        format: 'uuid',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for update-many: the updated records under `update<Names>`.
export const getUpdateManyResponse200 = (
  item: Pick<FlatObjectMetadata, 'namePlural' | 'nameSingular'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(item.nameSingular)}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`update${capitalize(item.namePlural)}`]: {
                  type: 'array',
                  items: {
                    $ref: schemaRef,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for delete-one: the deleted record's id, key varies
// (`delete<Name>` vs `deleteOne<Name>`) between the core and metadata APIs.
export const getDeleteResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular'>,
  fromMetadata = false,
) => {
  const one = fromMetadata ? 'One' : '';

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`delete${one}${capitalize(item.nameSingular)}`]: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'string',
                      format: 'uuid',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response shape for the endpoint that serves the OpenAPI document itself.
export const getJsonResponse = () => {
  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            openapi: { type: 'string' },
            info: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                termsOfService: { type: 'string' },
                contact: {
                  type: 'object',
                  properties: { email: { type: 'string' } },
                },
                license: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    url: { type: 'string' },
                  },
                },
              },
            },
            servers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            components: {
              type: 'object',
              properties: {
                schemas: { type: 'object' },
                parameters: { type: 'object' },
                responses: { type: 'object' },
              },
            },
            paths: {
              type: 'object',
            },
            tags: {
              type: 'object',
            },
          },
        },
      },
    },
  };
};

// Response for find-duplicates: per-input duplicate groups with pagination.
export const getFindDuplicatesResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  totalCount: { type: 'number' },
                  pageInfo: {
                    type: 'object',
                    properties: {
                      hasNextPage: { type: 'boolean' },
                      startCursor: {
                        type: 'string',
                        format: 'uuid',
                      },
                      endCursor: {
                        type: 'string',
                        format: 'uuid',
                      },
                    },
                  },
                  [`${item.nameSingular}Duplicates`]: {
                    type: 'array',
                    items: {
                      $ref: schemaRef,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for merge-many: the resulting merged record under `merge<Names>`.
export const getMergeManyResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular' | 'namePlural'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`merge${capitalize(item.namePlural)}`]: {
                  $ref: schemaRef,
                },
              },
            },
          },
        },
      },
    },
  };
};

// Response for group-by: one entry per group with dimension values, sampled
// records (optional), and aggregate values.
export const getGroupByResponse200 = (
  item: Pick<FlatObjectMetadata, 'nameSingular' | 'namePlural'>,
) => {
  const schemaRef = `#/components/schemas/${capitalize(
    item.nameSingular,
  )}ForResponse`;

  return {
    description: 'Successful operation',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                [`${item.namePlural}GroupBy`]: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      groupByDimensionValues: {
                        type: 'array',
                        description:
                          'Array of values representing each dimension in the group',
                        items: {
                          type: 'string',
                        },
                      },
                      records: {
                        type: 'array',
                        description:
                          'Sample of records for this group (only present when include_records_sample is true)',
                        items: {
                          $ref: schemaRef,
                        },
                      },
                    },
                    additionalProperties: {
                      type: 'number',
                      description: 'Aggregate values (e.g., countNotEmptyId)',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};
