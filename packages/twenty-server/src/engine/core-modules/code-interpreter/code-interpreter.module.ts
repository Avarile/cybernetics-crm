import { type DynamicModule, Global } from '@nestjs/common';

import { CodeInterpreterDriverFactory } from 'src/engine/core-modules/code-interpreter/code-interpreter-driver.factory';
import { CodeInterpreterService } from 'src/engine/core-modules/code-interpreter/code-interpreter.service';
import { TwentyConfigModule } from 'src/engine/core-modules/twenty-config/twenty-config.module';

// Registers the code interpreter driver factory and service globally
@Global()
export class CodeInterpreterModule {
  // Builds the dynamic module wiring the driver factory to the config module
  static forRoot(): DynamicModule {
    return {
      module: CodeInterpreterModule,
      imports: [TwentyConfigModule],
      providers: [CodeInterpreterDriverFactory, CodeInterpreterService],
      exports: [CodeInterpreterService],
    };
  }
}
