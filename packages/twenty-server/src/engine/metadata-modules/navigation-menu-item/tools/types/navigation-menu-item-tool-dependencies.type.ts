// Service dependencies shared by the navigation menu item agent tools.

import type { NavigationMenuItemService } from 'src/engine/metadata-modules/navigation-menu-item/navigation-menu-item.service';

export type NavigationMenuItemToolDependencies = {
  navigationMenuItemService: NavigationMenuItemService;
};
