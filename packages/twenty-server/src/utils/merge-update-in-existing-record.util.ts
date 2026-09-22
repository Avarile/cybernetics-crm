// Returns a copy of `existing` with only the given `properties` overwritten from
// `update`, and only where those fields are actually present in the update payload.
export const mergeUpdateInExistingRecord = <
  TExisting,
  P extends keyof TExisting,
  TUpdate extends Partial<TExisting>,
>({
  existing,
  properties,
  update,
}: {
  existing: TExisting;
  update: TUpdate;
  properties: P[];
}) =>
  properties.reduce((acc, property) => {
    const isPropertyUpdated = update[property] !== undefined;

    return {
      ...acc,
      ...(isPropertyUpdated ? { [property]: update[property] } : {}),
    };
  }, existing);
