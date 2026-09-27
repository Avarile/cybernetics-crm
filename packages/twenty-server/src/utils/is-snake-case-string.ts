// Despite the name, this matches SCREAMING_SNAKE_CASE (uppercase segments), not lower snake_case.
// The negative lookahead rejects consecutive underscores.
const SNAKE_CASE_REGEX = /^(?!.*__)[A-Z][A-Z0-9]*(_[A-Z0-9]+)*$/;

export const isSnakeCaseString = (str: string) => SNAKE_CASE_REGEX.test(str);
