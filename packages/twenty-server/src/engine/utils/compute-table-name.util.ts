// Underscore-prefixing custom-app tables keeps them out of the standard application's
// namespace, so a custom object can never collide with a future standard one of the same name.
export const customNamePrefix = '_';

export const computeTableName = (nameSingular: string, isCustom: boolean) => {
  return isCustom ? `${customNamePrefix}${nameSingular}` : nameSingular;
};
