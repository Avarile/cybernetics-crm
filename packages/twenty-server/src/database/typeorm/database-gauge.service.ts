import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';

import { DataSource } from 'typeorm';

import { MetricsService } from 'src/engine/core-modules/metrics/metrics.service';

// Registers an observable metrics gauge (twenty_database_up) that reports whether
// the primary database is reachable, sampled via a lightweight `SELECT 1`.
@Injectable()
export class DatabaseGaugeService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseGaugeService.name);

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly metricsService: MetricsService,
  ) {}

  onModuleInit() {
    this.metricsService.createObservableGauge({
      metricName: 'twenty_database_up',
      options: {
        description: 'Whether the database is reachable (1 = up, 0 = down)',
      },
      callback: async () => {
        return this.isDatabaseUp();
      },
      cacheValue: true,
    });
  }

  // Returns 1 if a trivial query succeeds, 0 (logging the error) otherwise.
  private async isDatabaseUp(): Promise<number> {
    try {
      await this.dataSource.query('SELECT 1');

      return 1;
    } catch (error) {
      this.logger.error('Database health check failed', error);

      return 0;
    }
  }
}
