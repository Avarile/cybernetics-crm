// Groups the core-engine resolvers and the direct-execution fast path
// so they can be imported together by whichever GraphQL API module
// needs the workspace-record ('core') schema and its optimizations.
import { Module } from '@nestjs/common';

import { DirectExecutionModule } from 'src/engine/api/graphql/direct-execution/direct-execution.module';
import { CoreEngineModule } from 'src/engine/core-modules/core-engine.module';

@Module({
  imports: [CoreEngineModule, DirectExecutionModule],
  providers: [],
  exports: [CoreEngineModule, DirectExecutionModule],
})
export class GraphQLConfigModule {}
