import {
  type CodeExecutionResult,
  type CodeInterpreterDriver,
  type ExecutionContext,
  type InputFile,
  type StreamCallbacks,
} from './interfaces/code-interpreter-driver.interface';

// No-op driver used when the code interpreter is turned off or misconfigured;
// every call fails with the reason explaining why it's disabled
export class DisabledDriver implements CodeInterpreterDriver {
  constructor(private reason: string) {}

  async execute(
    _code: string,
    _files?: InputFile[],
    _context?: ExecutionContext,
    _callbacks?: StreamCallbacks,
  ): Promise<CodeExecutionResult> {
    throw new Error(this.reason);
  }
}
