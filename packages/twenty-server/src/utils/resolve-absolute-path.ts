export const resolveAbsolutePath = (path: string): string => {
  // Relative paths resolve against process.cwd(), not this file's location.
  return path.startsWith('/') ? path : process.cwd() + '/' + path;
};
