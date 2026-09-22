import { CommonSelectFieldsHelper } from 'src/engine/api/common/common-select-fields/common-select-fields-helper';

// NestJS provider list for services the REST handlers use to translate
// REST-specific request args into the common query-runner args shape.
export const restToCommonArgsHandlers = [CommonSelectFieldsHelper];
