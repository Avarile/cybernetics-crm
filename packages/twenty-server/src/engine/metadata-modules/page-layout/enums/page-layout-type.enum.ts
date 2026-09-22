// Distinguishes what a page layout is used for: an object's record index
// (list view page), an individual record's page, a dashboard, or a
// standalone (non-record) page.
export enum PageLayoutType {
  RECORD_INDEX = 'RECORD_INDEX',
  RECORD_PAGE = 'RECORD_PAGE',
  DASHBOARD = 'DASHBOARD',
  STANDALONE_PAGE = 'STANDALONE_PAGE',
}
