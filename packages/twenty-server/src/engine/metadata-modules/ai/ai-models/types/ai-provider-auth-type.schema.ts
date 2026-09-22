import { z } from 'zod';

// The supported ways a provider can be authenticated: static API key, static
// credential pair (e.g. AWS access/secret keys), or an assumed IAM role.
export const aiProviderAuthTypeSchema = z.enum(['key', 'credentials', 'role']);
