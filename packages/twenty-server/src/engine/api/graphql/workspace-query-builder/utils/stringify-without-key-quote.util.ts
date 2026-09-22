// JSON-stringifies an object but strips the quotes around keys, for
// embedding object literals directly into generated SQL/GraphQL text.
// oxlint-disable-next-line typescript/no-explicit-any
export const stringifyWithoutKeyQuote = (obj: any) => {
  const jsonString = JSON.stringify(obj);
  const jsonWithoutQuotes = jsonString?.replace(/"(\w+)"\s*:/g, '$1:');

  return jsonWithoutQuotes;
};
