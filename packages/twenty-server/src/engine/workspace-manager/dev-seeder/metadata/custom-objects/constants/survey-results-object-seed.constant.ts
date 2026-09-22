import { type ObjectMetadataSeed } from 'src/engine/workspace-manager/dev-seeder/metadata/types/object-metadata-seed.type';

// Sample custom object "Survey Result", used to demo custom fields with
// varied number/text/file settings.
export const SURVEY_RESULT_CUSTOM_OBJECT_SEED: ObjectMetadataSeed = {
  labelPlural: 'Survey results',
  labelSingular: 'Survey result',
  namePlural: 'surveyResults',
  nameSingular: 'surveyResult',
  icon: 'IconRulerMeasure',
};
