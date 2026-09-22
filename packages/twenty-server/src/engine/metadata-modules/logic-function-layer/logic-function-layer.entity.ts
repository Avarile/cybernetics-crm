import { type PackageJson } from 'type-fest';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

// A workspace's installed logic-function dependency layer: the package.json/yarn.lock
// used to resolve npm packages available to serverless functions, plus checksums to
// detect when the layer needs to be rebuilt.
@Entity('logicFunctionLayer')
export class LogicFunctionLayerEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'jsonb', nullable: false })
  packageJson: PackageJson;

  @Column({ type: 'text', nullable: false })
  yarnLock: string;

  @Column({ type: 'text', nullable: true })
  packageJsonChecksum?: string;

  @Column({ type: 'text', nullable: false })
  yarnLockChecksum: string;

  @Column({ type: 'jsonb', nullable: false, default: {} })
  availablePackages: Record<string, string>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
