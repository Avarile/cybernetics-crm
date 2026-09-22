import { Global, Module } from '@nestjs/common';

import { I18nService } from 'src/engine/core-modules/i18n/i18n.service';

// Registers the i18n service globally, providing translated Lingui catalogs per locale
@Global()
@Module({
  providers: [I18nService],
  exports: [I18nService],
})
export class I18nModule {}
