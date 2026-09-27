import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';
import { type CustomWorkspaceEntity } from 'src/engine/twenty-orm/custom.workspace-entity';
import { type EntityRelation } from 'src/engine/workspace-manager/workspace-migration/types/entity-relation.interface';
import { type CompanyWorkspaceEntity } from 'src/modules/company/standard-objects/company.workspace-entity';
import { type DashboardWorkspaceEntity } from 'src/modules/dashboard/standard-objects/dashboard.workspace-entity';
import { type NoteWorkspaceEntity } from 'src/modules/note/standard-objects/note.workspace-entity';
import { type OpportunityWorkspaceEntity } from 'src/modules/opportunity/standard-objects/opportunity.workspace-entity';
import { type PersonWorkspaceEntity } from 'src/modules/person/standard-objects/person.workspace-entity';
import { type TaskWorkspaceEntity } from 'src/modules/task/standard-objects/task.workspace-entity';
import { type WorkflowWorkspaceEntity } from 'src/modules/workflow/common/standard-objects/workflow.workspace-entity';

// Standard object storing a link between a record (task, note, person, company,
// opportunity, dashboard, workflow, or any custom object) and a record in the
// external cybernetics-data-centre, plus a refreshable preview snapshot of it.
export class DatabaseRecordTargetWorkspaceEntity extends BaseWorkspaceEntity {
  targetTask: EntityRelation<TaskWorkspaceEntity> | null;
  targetTaskId: string | null;
  targetNote: EntityRelation<NoteWorkspaceEntity> | null;
  targetNoteId: string | null;
  targetPerson: EntityRelation<PersonWorkspaceEntity> | null;
  targetPersonId: string | null;
  targetCompany: EntityRelation<CompanyWorkspaceEntity> | null;
  targetCompanyId: string | null;
  targetOpportunity: EntityRelation<OpportunityWorkspaceEntity> | null;
  targetOpportunityId: string | null;
  targetDashboard: EntityRelation<DashboardWorkspaceEntity> | null;
  targetDashboardId: string | null;
  targetWorkflow: EntityRelation<WorkflowWorkspaceEntity> | null;
  targetWorkflowId: string | null;
  custom: EntityRelation<CustomWorkspaceEntity>;

  spaceId: string;
  baseId: string;
  tableId: string;
  recordId: string;
  viewId: string | null;

  recordName: string | null;
  baseName: string | null;
  tableName: string | null;
  previewFields: unknown;
  sourceUrl: string | null;
  snapshotStatus: string;
  snapshotAt: string | null;
}
