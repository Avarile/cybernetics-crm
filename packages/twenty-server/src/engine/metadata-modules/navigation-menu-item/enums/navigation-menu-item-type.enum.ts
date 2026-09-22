// Re-exports the shared NavigationMenuItemType enum after registering it as
// a GraphQL enum type.

import { registerEnumType } from '@nestjs/graphql';

import { NavigationMenuItemType } from 'twenty-shared/types';

registerEnumType(NavigationMenuItemType, {
  name: 'NavigationMenuItemType',
});

export { NavigationMenuItemType };
