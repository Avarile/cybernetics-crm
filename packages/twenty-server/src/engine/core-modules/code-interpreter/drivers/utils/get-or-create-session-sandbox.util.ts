import { type Sandbox } from '@e2b/code-interpreter';

import { isDefined } from 'twenty-shared/utils';

import { SESSION_SANDBOX_METADATA_KEY } from 'src/engine/core-modules/code-interpreter/constants/session-sandbox-metadata-key.constant';

// Finds or creates the warm E2B sandbox for a session, keeping it alive and
// killing any duplicate sandboxes left over for the same session
type SandboxApi = typeof Sandbox;

type GetOrCreateSessionSandboxArgs = {
  sandboxApi: SandboxApi;
  apiKey: string;
  sessionId: string;
  timeoutMs: number;
  idleTimeoutMs: number;
};

// Lists sandboxes tagged with the given session id, re-verifying the tag client-side
const listSandboxesForSession = async (
  sandboxApi: SandboxApi,
  apiKey: string,
  sessionId: string,
) => {
  const paginator = sandboxApi.list({
    apiKey,
    query: {
      state: ['running', 'paused'],
      metadata: { [SESSION_SANDBOX_METADATA_KEY]: sessionId },
    },
  });

  const sandboxes: Awaited<ReturnType<typeof paginator.nextItems>> = [];

  while (paginator.hasNext) {
    sandboxes.push(...(await paginator.nextItems()));
  }

  // Re-check the tag client-side so a loose server-side match can never reuse
  // another tenant's sandbox.
  return sandboxes.filter(
    (sandbox) => sandbox.metadata?.[SESSION_SANDBOX_METADATA_KEY] === sessionId,
  );
};

// Connects to an existing sandbox and refreshes its timeout, killing it if the
// timeout can't be refreshed rather than leaving it running unattended
const connectAndKeepAlive = async (
  sandboxApi: SandboxApi,
  apiKey: string,
  sandboxId: string,
  timeoutMs: number,
): Promise<Sandbox | undefined> => {
  const sandbox = await sandboxApi
    .connect(sandboxId, { apiKey })
    .catch(() => undefined);

  if (!isDefined(sandbox)) {
    return undefined;
  }

  try {
    await sandbox.setTimeout(timeoutMs);

    return sandbox;
  } catch {
    // Couldn't refresh the timeout — kill it instead of leaking a running sandbox.
    await sandbox.kill().catch(() => undefined);

    return undefined;
  }
};

// Kills a sandbox by id, swallowing errors since this is best-effort cleanup
const killSandboxById = (
  sandboxApi: SandboxApi,
  apiKey: string,
  sandboxId: string,
) => sandboxApi.kill(sandboxId, { apiKey }).catch(() => undefined);

// Creates a new sandbox tagged with the session id, configured to pause on
// timeout and auto-resume on next use
const createSessionSandbox = (
  sandboxApi: SandboxApi,
  apiKey: string,
  sessionId: string,
  timeoutMs: number,
) =>
  sandboxApi.create({
    apiKey,
    timeoutMs,
    lifecycle: { onTimeout: 'pause', autoResume: true },
    metadata: { [SESSION_SANDBOX_METADATA_KEY]: sessionId },
  });

// Reuses the session's live sandbox if one connects successfully, killing any
// other duplicates found for the session; otherwise creates a fresh one
export const getOrCreateSessionSandbox = async ({
  sandboxApi,
  apiKey,
  sessionId,
  timeoutMs,
  idleTimeoutMs,
}: GetOrCreateSessionSandboxArgs): Promise<{
  sandbox: Sandbox;
  isReused: boolean;
}> => {
  // The sandbox must outlive a single execution and the idle window before it
  // auto-pauses, so take the larger of the two.
  const aliveTimeoutMs = Math.max(timeoutMs, idleTimeoutMs);

  const sessionSandboxes = await listSandboxesForSession(
    sandboxApi,
    apiKey,
    sessionId,
  );

  let reusedSandbox: Sandbox | undefined;
  let reusedSandboxId: string | undefined;

  for (const { sandboxId } of sessionSandboxes) {
    const sandbox = await connectAndKeepAlive(
      sandboxApi,
      apiKey,
      sandboxId,
      aliveTimeoutMs,
    );

    if (isDefined(sandbox)) {
      reusedSandbox = sandbox;
      reusedSandboxId = sandboxId;
      break;
    }
  }

  if (isDefined(reusedSandbox)) {
    await Promise.all(
      sessionSandboxes
        .filter(({ sandboxId }) => sandboxId !== reusedSandboxId)
        .map(({ sandboxId }) => killSandboxById(sandboxApi, apiKey, sandboxId)),
    );

    return { sandbox: reusedSandbox, isReused: true };
  }

  const sandbox = await createSessionSandbox(
    sandboxApi,
    apiKey,
    sessionId,
    aliveTimeoutMs,
  );

  return { sandbox, isReused: false };
};
