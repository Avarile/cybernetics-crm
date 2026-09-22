// Assigns a type only when the field metadata type is exactly the expected
// one (or unresolved/generic), otherwise resolves to never|null — used to
// type relation/morph-only columns on FieldMetadataEntity.
import { type FieldMetadataType, type IsExactly } from 'twenty-shared/types';

export type AssignIfIsGivenFieldMetadataType<
  TTypeToAssign,
  TInputFieldMetadataType extends FieldMetadataType,
  TExpectedFieldMetadataType extends FieldMetadataType,
> =
  IsExactly<TInputFieldMetadataType, FieldMetadataType> extends true
    ? null | TTypeToAssign
    : TInputFieldMetadataType extends TExpectedFieldMetadataType
      ? TTypeToAssign
      : TInputFieldMetadataType extends TExpectedFieldMetadataType
        ? TTypeToAssign
        : never | null;
