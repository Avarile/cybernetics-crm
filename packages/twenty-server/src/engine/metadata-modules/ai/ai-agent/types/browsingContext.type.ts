// Describes the page a user was viewing when they invoked chat, so the agent
// can ground its response in that record or list view.
export type BrowsingContextType =
  | {
      type: 'recordPage';
      objectNameSingular: string;
      recordId: string;
      pageLayoutId?: string;
      activeTabId?: string | null;
    }
  | {
      type: 'listView';
      objectNameSingular: string;
      viewId: string;
      viewName: string;
      filterDescriptions: string[];
    };
