// Quick test script for migration checker
const { checkMigrationStatus } = require('./src/lib/db/migration-checker.ts');

async function test() {
  console.log('🔍 Testing migration check...\n');
  
  try {
    const status = await checkMigrationStatus();
    console.log('Status:', status);
    console.log('\nMessage:', status.message);
    console.log('In Sync:', status.inSync);
    console.log('Local Migrations:', status.localMigrations);
    console.log('Applied Migrations:', status.appliedMigrations);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

test();
