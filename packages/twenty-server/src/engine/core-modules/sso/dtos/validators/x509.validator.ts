/* @license Enterprise */

// class-validator decorator validating that a string is a well-formed X.509
// certificate (used for SAML SSO setup).
import * as crypto from 'crypto';

import {
  registerDecorator,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsX509CertificateConstraint implements ValidatorConstraintInterface {
  // oxlint-disable-next-line typescript/no-explicit-any
  // Attempts to parse the value as a base64-encoded X.509 certificate.
  validate(value: any) {
    if (typeof value !== 'string') {
      return false;
    }

    try {
      const cleanCert = value.replace(
        /-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\n|\r/g,
        '',
      );

      const der = Buffer.from(cleanCert, 'base64');

      const cert = new crypto.X509Certificate(der);

      return cert instanceof crypto.X509Certificate;
    } catch {
      return false;
    }
  }

  defaultMessage() {
    return 'The string is not a valid X509 certificate';
  }
}

// Property decorator applying the X509 certificate validator.
export function IsX509Certificate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsX509CertificateConstraint,
    });
  };
}
