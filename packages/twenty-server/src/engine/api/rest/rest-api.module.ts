import { Module } from '@nestjs/common';

import { RestApiCoreModule } from 'src/engine/api/rest/core/rest-api-core.module';

// Top-level NestJS module for the REST API, currently just re-exporting
// the core CRUD module.
@Module({
  imports: [RestApiCoreModule],
})
export class RestApiModule {}
