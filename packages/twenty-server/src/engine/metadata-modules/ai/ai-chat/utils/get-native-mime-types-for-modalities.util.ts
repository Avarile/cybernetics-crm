import { MODALITY_TO_MIME_TYPES } from 'src/engine/metadata-modules/ai/ai-chat/constants/modality-to-mime-types.constant';

// Flattens a model's supported modalities into the set of MIME types it can natively accept.
export const getNativeMimeTypesForModalities = (
  modalities: string[] = [],
): Set<string> =>
  new Set(
    modalities.flatMap((modality) => MODALITY_TO_MIME_TYPES[modality] ?? []),
  );
