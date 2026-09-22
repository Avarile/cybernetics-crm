// Sends an email immediately (synchronously) through the currently active
// email driver, without going through the message queue.
import { Injectable } from '@nestjs/common';

import { type SendMailOptions } from 'nodemailer';

import { type EmailDriverInterface } from 'src/engine/core-modules/email/drivers/interfaces/email-driver.interface';

import { EmailDriverFactory } from 'src/engine/core-modules/email/email-driver.factory';

@Injectable()
export class EmailSenderService implements EmailDriverInterface {
  constructor(private readonly emailDriverFactory: EmailDriverFactory) {}

  // Delegates to the active driver's send method.
  async send(sendMailOptions: SendMailOptions): Promise<void> {
    const driver = this.emailDriverFactory.getCurrentDriver();

    await driver.send(sendMailOptions);
  }
}
