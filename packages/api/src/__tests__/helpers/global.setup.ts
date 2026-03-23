// Mama Fua — Global Test Setup
// KhimTech | QA: Maryann Wanjiru | 2026

import { execSync } from 'child_process';

export default async function globalSetup() {
  console.log('\n🧪 Mama Fua Test Suite — KhimTech | Maryann Wanjiru QA\n');

  // Run migrations on test database
  try {
    execSync('pnpm --filter database db:migrate:deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/mamafua_test',
        DIRECT_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/mamafua_test',
      },
      stdio: 'pipe',
    });
    console.log('✅ Test database migrations applied');
  } catch {
    console.log('⚠️  Could not run migrations (test DB may not be running — integration tests will fail)');
  }
}
