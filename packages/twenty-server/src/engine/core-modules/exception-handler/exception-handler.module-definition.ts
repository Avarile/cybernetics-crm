import { ConfigurableModuleBuilder } from '@nestjs/common';

import { type ExceptionHandlerModuleOptions } from 'src/engine/core-modules/exception-handler/interfaces';

// Generates the configurable-module boilerplate (forRoot, options tokens) for
// ExceptionHandlerModule
export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ExceptionHandlerModuleOptions>({
  moduleName: 'ExceptionHandlerModule',
})
  .setClassMethodName('forRoot')
  .build();
