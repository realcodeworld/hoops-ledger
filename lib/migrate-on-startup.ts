/**
 * Run database migrations on application startup
 * This is called automatically when the app starts in production
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

let migrationRun = false

export async function runMigrationsOnStartup() {
  // Only run once per process
  if (migrationRun) {
    return
  }

  // Only run in production
  if (process.env.NODE_ENV !== 'production') {
    return
  }

  // Check if we should auto-run migrations
  if (process.env.AUTO_RUN_MIGRATIONS !== 'true') {
    console.log('Auto-run migrations disabled. Set AUTO_RUN_MIGRATIONS=true to enable.')
    return
  }

  try {
    console.log('🔄 Running database migrations on startup...')
    const { stdout, stderr } = await execAsync('pnpm prisma migrate deploy')
    
    if (stdout) {
      console.log('✅ Migrations completed:', stdout)
    }
    
    if (stderr && !stderr.includes('No pending migrations')) {
      console.warn('⚠️ Migration warnings:', stderr)
    }
    
    migrationRun = true
  } catch (error: any) {
    // Don't crash the app if migrations fail
    console.error('❌ Migration error:', error.message)
    console.error('Migration output:', error.stdout)
    console.error('Migration errors:', error.stderr)
    
    // If it's just "no pending migrations", that's fine
    if (error.message?.includes('No pending migrations')) {
      console.log('✅ No pending migrations')
      migrationRun = true
      return
    }
    
    // For other errors, log but don't crash
    console.error('⚠️ Continuing despite migration errors. Check your database connection.')
  }
}
