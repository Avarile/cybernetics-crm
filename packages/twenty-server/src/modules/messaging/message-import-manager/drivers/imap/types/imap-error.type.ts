// Shape of the extra fields ImapFlow attaches to errors it throws.
export interface ImapFlowError extends Error {
  code?: string;
  serverResponseCode?: string;
  responseText?: string;
  responseStatus?: string;
  executedCommand?: string;
  authenticationFailed?: boolean;
  response?: string;
  syscall?: string;
  errno?: number;
}
