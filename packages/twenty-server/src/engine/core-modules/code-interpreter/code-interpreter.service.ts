import { Injectable } from '@nestjs/common';

import { isDefined } from 'twenty-shared/utils';

import { CodeInterpreterDriverFactory } from 'src/engine/core-modules/code-interpreter/code-interpreter-driver.factory';
import { CodeInterpreterDriverType } from 'src/engine/core-modules/code-interpreter/code-interpreter.interface';
import {
  type CodeExecutionResult,
  type CodeInterpreterDriver,
  type ExecutionContext,
  type InputFile,
  type StreamCallbacks,
} from 'src/engine/core-modules/code-interpreter/drivers/interfaces/code-interpreter-driver.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

// Facade over the active code interpreter driver: executes code, manages sandbox
// lifecycle, and serializes concurrent executions within the same session
@Injectable()
export class CodeInterpreterService implements CodeInterpreterDriver {
  // One active stream per thread (the chat resolver queues the rest), so
  // in-process chaining is enough to serialize a session — no distributed lock.
  private readonly sessionExecutionTails = new Map<string, Promise<void>>();

  constructor(
    private readonly codeInterpreterDriverFactory: CodeInterpreterDriverFactory,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  isEnabled(): boolean {
    return (
      this.twentyConfigService.get('CODE_INTERPRETER_TYPE') !==
      CodeInterpreterDriverType.DISABLED
    );
  }

  // Releases the sandbox tied to a chat thread, if the current driver supports it
  async releaseThreadSandbox(
    workspaceId: string,
    threadId: string,
  ): Promise<void> {
    await this.codeInterpreterDriverFactory
      .getCurrentDriver()
      .releaseSession?.(`${workspaceId}:${threadId}`);
  }

  // Sweeps sandboxes idle longer than the configured max age, if the driver supports it
  async sweepExpiredSandboxes(): Promise<number> {
    const maxAgeMs = this.twentyConfigService.get(
      'CODE_INTERPRETER_SESSION_MAX_AGE_MS',
    );

    return (
      (await this.codeInterpreterDriverFactory
        .getCurrentDriver()
        .sweepExpiredSessions?.(maxAgeMs)) ?? 0
    );
  }

  // Executes code on the current driver, serializing calls sharing the same session id
  execute(
    code: string,
    files?: InputFile[],
    context?: ExecutionContext,
    callbacks?: StreamCallbacks,
  ): Promise<CodeExecutionResult> {
    const sessionId = context?.sessionId;

    if (isDefined(sessionId)) {
      return this.runSerializedPerSession(sessionId, () =>
        this.runOnDriver(code, files, context, callbacks),
      );
    }

    return this.runOnDriver(code, files, context, callbacks);
  }

  private runOnDriver(
    code: string,
    files?: InputFile[],
    context?: ExecutionContext,
    callbacks?: StreamCallbacks,
  ): Promise<CodeExecutionResult> {
    return this.codeInterpreterDriverFactory
      .getCurrentDriver()
      .execute(code, files, context, callbacks);
  }

  // Chains this task onto the session's promise tail so executions for the same
  // session never run concurrently, and cleans up the tail once idle
  private async runSerializedPerSession<T>(
    sessionId: string,
    task: () => Promise<T>,
  ): Promise<T> {
    const previous =
      this.sessionExecutionTails.get(sessionId) ?? Promise.resolve();
    const result = previous.then(task, task);
    const tail = result.then(
      () => undefined,
      () => undefined,
    );

    this.sessionExecutionTails.set(sessionId, tail);

    try {
      return await result;
    } finally {
      if (this.sessionExecutionTails.get(sessionId) === tail) {
        this.sessionExecutionTails.delete(sessionId);
      }
    }
  }
}
