// Per-file storage settings tracked on the file entity (temporary/deletion state).
export type FileFieldSettings = {
  isTemporaryFile: boolean;
  toDelete: boolean;
};

export type FileSettings = FileFieldSettings;
