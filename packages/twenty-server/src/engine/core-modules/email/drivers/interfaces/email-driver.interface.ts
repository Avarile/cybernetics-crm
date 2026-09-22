// Common interface implemented by every outbound email driver.
import { type SendMailOptions } from 'nodemailer';

export interface EmailDriverInterface {
  send(sendMailOptions: SendMailOptions): Promise<void>;
}
