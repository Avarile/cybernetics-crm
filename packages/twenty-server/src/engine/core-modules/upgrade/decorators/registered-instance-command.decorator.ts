import 'reflect-metadata';

import { Injectable } from '@nestjs/common';

import { type TwentyAllVersion } from 'src/engine/core-modules/upgrade/constants/twenty-all-versions.constant';

export type InstanceCommandType = 'fast' | 'slow';

export type RegisteredInstanceCommandMetadata = {
  version: TwentyAllVersion;
  timestamp: number;
  type: InstanceCommandType;
};

const REGISTERED_INSTANCE_COMMAND_KEY = 'REGISTERED_INSTANCE_COMMAND';

// When dropping a version from TWENTY_CROSS_UPGRADE_SUPPORTED_VERSIONS, also
// remove the @RegisteredInstanceCommand decorator from its associated
// command files.
// Class decorator that marks a class as a discoverable instance command, tagging
// it with the version it was introduced in and whether it's fast or slow
export const RegisteredInstanceCommand =
  (
    version: TwentyAllVersion,
    timestamp: number,
    options?: { type: 'slow' },
  ): ClassDecorator =>
  (target) => {
    Injectable()(target);
    Reflect.defineMetadata(
      REGISTERED_INSTANCE_COMMAND_KEY,
      { version, timestamp, type: options?.type ?? 'fast' },
      target,
    );
  };

// Reads the @RegisteredInstanceCommand metadata off a command class, if present
export const getRegisteredInstanceCommandMetadata = (
  target: Function,
): RegisteredInstanceCommandMetadata | undefined =>
  Reflect.getMetadata(REGISTERED_INSTANCE_COMMAND_KEY, target);
