import {
  registerDecorator,
  type ValidationOptions,
  type ValidationArguments,
} from 'class-validator';

// class-validator property decorator rejecting metadata names that are
// reserved GraphQL keywords/scalars or contain characters unsafe for use
// as an identifier (quotes, semicolons, path separators, etc.).
export function IsValidMetadataName(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidName',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        // oxlint-disable-next-line typescript/no-explicit-any
        validate(value: any) {
          return /^(?!(?:not|or|and|Int|Float|Boolean|String|ID)$)[^'"\\;.=*/]+$/.test(
            value,
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} has failed the name validation check`;
        },
      },
    });
  };
}
