import {
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';

// class-validator constraint used on JsonRpc.id, which per the JSON-RPC
// spec may be either a string or a number.
@ValidatorConstraint({ name: 'string-or-number', async: false })
export class IsNumberOrString implements ValidatorConstraintInterface {
  validate(value: unknown) {
    return typeof value === 'number' || typeof value === 'string';
  }

  defaultMessage() {
    return '($value) must be number or string';
  }
}
