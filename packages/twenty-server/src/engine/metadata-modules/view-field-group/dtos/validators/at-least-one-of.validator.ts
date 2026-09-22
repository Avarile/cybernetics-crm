import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
  ValidatorConstraint,
  type ValidatorConstraintInterface,
} from 'class-validator';
import { isDefined } from 'twenty-shared/utils';

@ValidatorConstraint({ async: false })
// Validation constraint requiring at least one of the named properties on
// the decorated class to be defined.
export class AtLeastOneOfConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const [properties] = args.constraints as [string[]];
    const object = args.object as Record<string, unknown>;

    return properties.some((property) => isDefined(object[property]));
  }

  defaultMessage(args: ValidationArguments) {
    const [properties] = args.constraints as [string[]];

    return `At least one of the following properties must be provided: ${properties.join(', ')}`;
  }
}

// Class decorator applying the AtLeastOneOfConstraint to require at least
// one of the given properties to be set.
export const AtLeastOneOf = (
  properties: string[],
  validationOptions?: ValidationOptions,
): ClassDecorator => {
  return (target) => {
    registerDecorator({
      target,
      propertyName: properties[0],
      options: validationOptions,
      constraints: [properties],
      validator: AtLeastOneOfConstraint,
    });
  };
};
