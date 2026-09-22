import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

import { isSafeRelativePath } from 'src/engine/core-modules/file-storage/utils/is-safe-relative-path.util';

// class-validator decorator that rejects strings failing isSafeRelativePath,
// for use on DTO fields carrying a storage-relative path
export function IsSafeRelativePath(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsSafeRelativePath',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'string') {
            return false;
          }

          return isSafeRelativePath(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} contains unsafe characters or path traversal`;
        },
      },
    });
  };
}
