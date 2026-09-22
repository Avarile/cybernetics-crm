import { type FlatEntityFrom } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-from.type';
import { type NavigationMenuItemEntity } from 'src/engine/metadata-modules/navigation-menu-item/entities/navigation-menu-item.entity';

// Flat (denormalized) representation of a NavigationMenuItemEntity used during workspace metadata diffing.
export type FlatNavigationMenuItem = FlatEntityFrom<NavigationMenuItemEntity>;
