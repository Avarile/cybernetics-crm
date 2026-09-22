import {
  PermissionsException,
  PermissionsExceptionCode,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import {
  ChartDataException,
  ChartDataExceptionCode,
  generateChartDataExceptionMessage,
} from 'src/modules/dashboard/chart-data/exceptions/chart-data.exception';

// Normalizes any error raised while computing chart data into a
// ChartDataException, mapping permission errors specifically and treating
// everything else as a query execution failure.
export const wrapChartDataQueryError = (
  error: unknown,
  contextPrefix: string,
): ChartDataException => {
  if (error instanceof ChartDataException) {
    return error;
  }

  if (
    error instanceof PermissionsException &&
    error.code === PermissionsExceptionCode.PERMISSION_DENIED
  ) {
    return new ChartDataException(
      generateChartDataExceptionMessage(
        ChartDataExceptionCode.PERMISSION_DENIED,
        error.message,
      ),
      ChartDataExceptionCode.PERMISSION_DENIED,
    );
  }

  return new ChartDataException(
    generateChartDataExceptionMessage(
      ChartDataExceptionCode.QUERY_EXECUTION_FAILED,
      `${contextPrefix}: ${error instanceof Error ? error.message : String(error)}`,
    ),
    ChartDataExceptionCode.QUERY_EXECUTION_FAILED,
  );
};
