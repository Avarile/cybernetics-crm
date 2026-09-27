// Referenced by @WasIntroducedInUpgrade on the "isSystemSideEffect" column across
// several metadata entities so pre-2.15 upgrade steps don't SELECT it before this
// command adds it.
export const ADD_IS_SYSTEM_SIDE_EFFECT_UPGRADE_COMMAND_NAME =
  '2.15.0_AddIsSystemSideEffectFastInstanceCommand_1781600000000';
