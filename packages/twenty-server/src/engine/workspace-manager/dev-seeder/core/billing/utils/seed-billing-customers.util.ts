import { type QueryRunner } from 'typeorm';

const tableName = 'billingCustomer';

type SeedBillingCustomersArgs = {
  queryRunner: QueryRunner;
  schemaName: string;
  workspaceId: string;
};

// Inserts a default billing customer row for the given dev-seeded workspace.
export const seedBillingCustomers = async ({
  queryRunner,
  schemaName,
  workspaceId,
}: SeedBillingCustomersArgs) => {
  await queryRunner.manager
    .createQueryBuilder()
    .insert()
    .into(`${schemaName}.${tableName}`, ['workspaceId', 'stripeCustomerId'])
    .orIgnore()
    .values([
      {
        workspaceId,
        stripeCustomerId: 'cus_default0',
      },
    ])
    .execute();
};
