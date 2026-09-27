export type WorkspaceSchemaColumnDefinition = {
  name: string;
  type: string;
  isNullable?: boolean;
  // undefined = no default; null = default value is SQL NULL. See
  // workspace-schema-column-manager.service.ts's alterColumnDefault.
  default?: string | number | boolean | null;
  isPrimary?: boolean;
  isArray?: boolean;
  asExpression?: string;
  generatedType?: 'STORED' | 'VIRTUAL';
};
