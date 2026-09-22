import { Module } from '@nestjs/common';

import { ContactCreationManagerModule } from 'src/modules/contact-creation-manager/contact-creation-manager.module';
import { CreateCompanyAndContactJob } from 'src/modules/contact-creation-manager/jobs/create-company-and-contact.job';

// Exposes the queue processor that auto-creates companies/contacts from
// message or calendar participants.
@Module({
  imports: [ContactCreationManagerModule],
  providers: [CreateCompanyAndContactJob],
})
export class AutoCompaniesAndContactsCreationJobModule {}
