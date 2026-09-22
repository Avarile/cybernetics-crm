type EmailAddress = string | string[];

type MicrosoftRecipient = {
  emailAddress: {
    address: string;
  };
};

// Converts one or more plain email addresses into Microsoft Graph's
// recipient object shape.
export const toMicrosoftRecipients = (
  addresses: EmailAddress | undefined,
): MicrosoftRecipient[] => {
  if (!addresses) return [];

  const addressArray = Array.isArray(addresses) ? addresses : [addresses];

  return addressArray.map((address) => ({
    emailAddress: { address },
  }));
};
