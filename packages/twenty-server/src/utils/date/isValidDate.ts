// oxlint-disable-next-line typescript/no-explicit-any
export const isValidDate = (date: any): date is Date => {
  // new Date('garbage') is still `instanceof Date`, but its getTime() is NaN.
  return date instanceof Date && !isNaN(date.getTime());
};
