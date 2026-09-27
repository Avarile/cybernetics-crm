// Referenced by @WasIntroducedInUpgrade on WorkflowEntity itself, marking when the
// "workflow" core table was created, so pre-2.20 upgrade steps don't query it first.
export const CREATE_WORKFLOW_CORE_TABLE_UPGRADE_COMMAND_NAME =
  '2.20.0_CreateWorkflowCoreTableFastInstanceCommand_1783603454479';
