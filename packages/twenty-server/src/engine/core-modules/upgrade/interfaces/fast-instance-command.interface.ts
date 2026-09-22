import { type QueryRunner } from 'typeorm';

// Contract for a schema-only instance command; up/down run inside the migration transaction
export interface FastInstanceCommand {
  up(queryRunner: QueryRunner): Promise<void>;
  down(queryRunner: QueryRunner): Promise<void>;
}
