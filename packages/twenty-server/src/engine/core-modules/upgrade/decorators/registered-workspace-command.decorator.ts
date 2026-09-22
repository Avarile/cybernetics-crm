import 'reflect-metadata';
import { TwentyAllVersion } from 'src/engine/core-modules/upgrade/constants/twenty-all-versions.constant';

export type RegisteredWorkspaceCommandMetadata = {
  version: TwentyAllVersion;
  timestamp: number;
};

const REGISTERED_WORKSPACE_COMMAND_KEY = 'REGISTERED_WORKSPACE_COMMAND';

// Class decorator that marks a class as a discoverable workspace command,
// tagging it with the version it was introduced in
export const RegisteredWorkspaceCommand =
  (version: TwentyAllVersion, timestamp: number): ClassDecorator =>
  (target) => {
    Reflect.defineMetadata(
      REGISTERED_WORKSPACE_COMMAND_KEY,
      { version, timestamp },
      target,
    );
  };

// Reads the @RegisteredWorkspaceCommand metadata off a command class, if present
export const getRegisteredWorkspaceCommandMetadata = (
  target: Function,
): RegisteredWorkspaceCommandMetadata | undefined =>
  Reflect.getMetadata(REGISTERED_WORKSPACE_COMMAND_KEY, target);
