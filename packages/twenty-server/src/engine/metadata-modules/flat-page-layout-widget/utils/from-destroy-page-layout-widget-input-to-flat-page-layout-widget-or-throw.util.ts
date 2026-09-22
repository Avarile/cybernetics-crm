// Resolves a DestroyPageLayoutWidgetInput to the existing flat widget it
// targets, throwing if the widget cannot be found.

import { t } from '@lingui/core/macro';
import {
  extractAndSanitizeObjectStringFields,
  isDefined,
} from 'twenty-shared/utils';

import { type FlatPageLayoutWidgetMaps } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget-maps.type';
import { findFlatEntityByIdInFlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/utils/find-flat-entity-by-id-in-flat-entity-maps.util';
import { type FlatPageLayoutWidget } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget.type';
import { type DestroyPageLayoutWidgetInput } from 'src/engine/metadata-modules/page-layout-widget/dtos/inputs/destroy-page-layout-widget.input';
import {
  PageLayoutWidgetException,
  PageLayoutWidgetExceptionCode,
} from 'src/engine/metadata-modules/page-layout-widget/exceptions/page-layout-widget.exception';

// Looks up the widget by id in the flat maps and throws
// PAGE_LAYOUT_WIDGET_NOT_FOUND if it doesn't exist.
export const fromDestroyPageLayoutWidgetInputToFlatPageLayoutWidgetOrThrow = ({
  destroyPageLayoutWidgetInput,
  flatPageLayoutWidgetMaps,
}: {
  destroyPageLayoutWidgetInput: DestroyPageLayoutWidgetInput;
  flatPageLayoutWidgetMaps: FlatPageLayoutWidgetMaps;
}): FlatPageLayoutWidget => {
  const { id: pageLayoutWidgetId } = extractAndSanitizeObjectStringFields(
    destroyPageLayoutWidgetInput,
    ['id'],
  );

  const existingFlatPageLayoutWidgetToDestroy =
    findFlatEntityByIdInFlatEntityMaps({
      flatEntityId: pageLayoutWidgetId,
      flatEntityMaps: flatPageLayoutWidgetMaps,
    });

  if (!isDefined(existingFlatPageLayoutWidgetToDestroy)) {
    throw new PageLayoutWidgetException(
      t`Page layout widget to destroy not found`,
      PageLayoutWidgetExceptionCode.PAGE_LAYOUT_WIDGET_NOT_FOUND,
    );
  }

  return existingFlatPageLayoutWidgetToDestroy;
};
