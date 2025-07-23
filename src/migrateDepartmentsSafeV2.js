import { supabase } from './supabaseClient.js';

process.stdout.write('Starting migration...\n');

// Test database connection
const { data: testData, error: testError } = await supabase
  .from('departments')
  .select('count');

if (testError) {
  process.stderr.write(`Database error: ${testError.message}\n`);
  process.exit(1);
}

process.stdout.write(`Connected to database. Current departments: ${testData[0].count}\n`);

// Get companies data
const { data: companies, error: companiesError } = await supabase
  .from('companies')
  .select('id, name, created_at, metadata');

if (companiesError) {
  process.stderr.write(`Failed to fetch companies: ${companiesError.message}\n`);
  process.exit(1);
}

process.stdout.write(`Found ${companies.length} companies to migrate\n`);

// Insert companies as departments
const { error: insertError } = await supabase
  .from('departments')
  .insert(
    companies.map(company => ({
      name: company.name,
      created_at: company.created_at,
      company_id: company.id,
      metadata: company.metadata || {}
    }))
  );

if (insertError) {
  process.stderr.write(`Failed to insert departments: ${insertError.message}\n`);
  process.exit(1);
}

process.stdout.write('Successfully migrated companies to departments\n');

// Verify final count
const { data: finalData, error: finalError } = await supabase
  .from('departments')
  .select('count');

if (finalError) {
  process.stderr.write(`Failed to verify final count: ${finalError.message}\n`);
  process.exit(1);
}

process.stdout.write(`Migration complete. Final department count: ${finalData[0].count}\n`);
process.exit(0); 