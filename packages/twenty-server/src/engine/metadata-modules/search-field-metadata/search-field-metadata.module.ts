import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SearchFieldMetadataEntity } from 'src/engine/metadata-modules/search-field-metadata/search-field-metadata.entity';

// Registers the SearchFieldMetadataEntity repository for injection elsewhere.
@Module({
  imports: [TypeOrmModule.forFeature([SearchFieldMetadataEntity])],
  providers: [],
  exports: [],
})
export class SearchFieldMetadataModule {}
