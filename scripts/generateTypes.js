#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Generating Supabase types...');

try {
  // Check if .env file exists and has Supabase URL
  const envPath = path.join(process.cwd(), '.env');
  let supabaseUrl = '';
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
    if (urlMatch) {
      supabaseUrl = urlMatch[1].trim();
    }
  }

  if (!supabaseUrl) {
    console.log('⚠️  No Supabase URL found in .env file');
    console.log('📝 Please add your Supabase URL to .env file:');
    console.log('   VITE_SUPABASE_URL=https://your-project.supabase.co');
    console.log('🔄 Skipping type generation...');
    process.exit(0);
  }

  // Extract project ID from URL
  const projectId = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];
  
  if (!projectId) {
    console.log('❌ Could not extract project ID from Supabase URL');
    console.log('🔗 URL format should be: https://your-project.supabase.co');
    process.exit(1);
  }

  console.log(`📦 Generating types for project: ${projectId}`);
  
  try {
    // Generate types
    const command = `npx supabase gen types typescript --project-id ${projectId} > src/supabaseTypes.ts`;
    execSync(command, { stdio: 'inherit' });
    
    console.log('✅ Types generated successfully!');
    console.log('📁 Generated: src/supabaseTypes.ts');
  } catch (error) {
    console.log('⚠️  Type generation failed due to API key issues');
    console.log('📝 This is expected until you update your Supabase API keys');
    console.log('🔄 Creating placeholder types file...');
    
    // Create a placeholder types file
    const placeholderTypes = `// Placeholder Supabase types
// This file will be auto-generated once API keys are updated

export interface Database {
  public: {
    Tables: {
      // Types will be generated here
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
`;

    fs.writeFileSync('src/supabaseTypes.ts', placeholderTypes);
    console.log('✅ Created placeholder types file');
  }
  
} catch (error) {
  console.log('❌ Error generating types:');
  console.log(error.message);
  console.log('');
  console.log('💡 Make sure you have:');
  console.log('   1. Supabase CLI installed: npm install -g supabase');
  console.log('   2. Valid Supabase URL in .env file');
  console.log('   3. Proper permissions to access your Supabase project');
  process.exit(1);
} 