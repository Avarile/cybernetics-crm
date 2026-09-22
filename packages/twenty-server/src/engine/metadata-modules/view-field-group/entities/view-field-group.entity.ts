import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';

import { ViewFieldEntity } from 'src/engine/metadata-modules/view-field/entities/view-field.entity';
import { ViewEntity } from 'src/engine/metadata-modules/view/entities/view.entity';
import { OverridableEntity } from 'src/engine/workspace-manager/types/overridable-entity';

// Workspace-level fields that can override a standard-app view field
// group's defaults without mutating the original definition.
export type ViewFieldGroupOverrides = {
  name?: string;
  position?: number;
  isVisible?: boolean;
};

@Entity({ name: 'viewFieldGroup', schema: 'core' })
@Index('IDX_VIEW_FIELD_GROUP_WORKSPACE_ID_VIEW_ID', ['workspaceId', 'viewId'])
@Index('IDX_VIEW_FIELD_GROUP_VIEW_ID', ['viewId'])
// TypeORM entity for a view field group: a named section that groups a
// subset of a view's fields, with visibility and display position.
export class ViewFieldGroupEntity
  extends OverridableEntity<ViewFieldGroupOverrides>
  implements Required<ViewFieldGroupEntity>
{
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, type: 'text' })
  name: string;

  @Column({ nullable: false, type: 'double precision', default: 0 })
  position: number;

  @Column({ nullable: false, default: true })
  isVisible: boolean;

  @Column({ nullable: false, type: 'uuid' })
  viewId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date | null;

  @ManyToOne(() => ViewEntity, (view) => view.viewFieldGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'viewId' })
  view: Relation<ViewEntity>;

  @OneToMany(() => ViewFieldEntity, (viewField) => viewField.viewFieldGroup)
  viewFields: Relation<ViewFieldEntity[]>;
}
