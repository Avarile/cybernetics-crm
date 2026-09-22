// Method decorator reporting a cron job's execution to Sentry Cron Monitors
// (check-ins for start/success/failure), when Sentry is initialized.
import * as Sentry from '@sentry/node';

// Wraps the decorated method with Sentry checkIn calls tracking the given
// monitor, using `schedule` (a crontab expression) to configure the monitor.
export function SentryCronMonitor(monitorSlug: string, schedule: string) {
  return function (
    // oxlint-disable-next-line typescript/no-explicit-any
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    // oxlint-disable-next-line typescript/no-explicit-any
    descriptor.value = async function (...args: any[]) {
      if (!Sentry.isInitialized()) {
        return await originalMethod.apply(this, args);
      }

      let checkInId: string | undefined;

      try {
        checkInId = Sentry.captureCheckIn(
          {
            monitorSlug,
            status: 'in_progress',
          },
          {
            schedule: {
              type: 'crontab',
              value: schedule,
            },
            checkinMargin: 1,
            maxRuntime: 5,
            timezone: 'UTC',
          },
        );
        const result = await originalMethod.apply(this, args);

        Sentry.captureCheckIn({
          checkInId,
          monitorSlug,
          status: 'ok',
        });

        return result;
      } catch (error) {
        Sentry.captureCheckIn({
          checkInId,
          monitorSlug,
          status: 'error',
        });
        throw error;
      }
    };

    return descriptor;
  };
}
