export const getDomainFromEmail = (email: string): string | undefined => {
  // lastIndexOf, not indexOf: a quoted local part can itself contain "@" (eg: "a@b"@example.com).
  const lastAtIndex = email.lastIndexOf('@');

  if (lastAtIndex === -1) {
    return undefined;
  }

  return email.slice(lastAtIndex + 1);
};
