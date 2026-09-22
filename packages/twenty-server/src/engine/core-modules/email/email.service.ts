// Public entry point for sending transactional emails: enqueues the email
// onto a background job queue (with retries) rather than sending inline.
import { Injectable } from '@nestjs/common';

import { type SendMailOptions } from 'nodemailer';

import { EmailSenderJob } from 'src/engine/core-modules/email/email-sender.job';
import { InjectMessageQueue } from 'src/engine/core-modules/message-queue/decorators/message-queue.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { MessageQueueService } from 'src/engine/core-modules/message-queue/services/message-queue.service';

@Injectable()
export class EmailService {
  constructor(
    @InjectMessageQueue(MessageQueue.emailQueue)
    private readonly messageQueueService: MessageQueueService,
  ) {}

  // Enqueues the email to be sent by EmailSenderJob, retrying up to 3 times
  // on failure.
  async send(sendMailOptions: SendMailOptions): Promise<void> {
    await this.messageQueueService.add<SendMailOptions>(
      EmailSenderJob.name,
      sendMailOptions,
      { retryLimit: 3 },
    );
  }
}
