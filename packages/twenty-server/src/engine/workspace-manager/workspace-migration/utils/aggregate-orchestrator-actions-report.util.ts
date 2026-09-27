import { type AggregateOrchestratorActionsReportArgs } from 'src/engine/workspace-manager/workspace-migration/types/workspace-migration-aggregate-orchestrator-actions-report-args.type';
import { aggregateNonRelationFieldsIntoObjectActions } from 'src/engine/workspace-manager/workspace-migration/utils/aggregate-non-relation-fields-into-object-actions.util';
import { aggregateOrchestratorActionsReportDeprioritizeSearchVectorUpdateFieldActions } from 'src/engine/workspace-manager/workspace-migration/utils/aggregate-orchestrator-actions-report-deprioritize-search-vector-update-field-actions.util';
import { aggregateRelationFieldPairs } from 'src/engine/workspace-manager/workspace-migration/utils/aggregate-relation-field-pairs.util';

export const aggregateOrchestratorActionsReport = ({
  orchestratorActionsReport,
  flatFieldMetadataMaps,
  searchVectorUniversalIdentifiersToRebuild,
}: AggregateOrchestratorActionsReportArgs) => {
  // Order matters: each step consumes the previous step's output, so re-ordering
  // changes which actions are eligible to be folded/deprioritized by later steps.
  const aggregatedOrchestratorActionsReport = [
    aggregateNonRelationFieldsIntoObjectActions,
    aggregateRelationFieldPairs,
    aggregateOrchestratorActionsReportDeprioritizeSearchVectorUpdateFieldActions,
  ].reduce(
    (currentOrchestratorActionsReport, aggregator) =>
      aggregator({
        orchestratorActionsReport: currentOrchestratorActionsReport,
        flatFieldMetadataMaps,
        searchVectorUniversalIdentifiersToRebuild,
      }),
    orchestratorActionsReport,
  );

  return { aggregatedOrchestratorActionsReport };
};
