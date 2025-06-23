# SQL Files Documentation

This folder contains all the SQL scripts used for setting up and maintaining the Sequential Blotto game database.

## Core Setup Files

### `database_schema.sql`
**Purpose**: Complete database schema with all tables, indexes, RLS policies, and triggers
**When to use**: Initial database setup
**Contains**: 
- All table definitions (game_rooms, game_moves, game_records, user_stats, user_profiles)
- Row Level Security (RLS) policies
- Indexes for performance
- Triggers for automatic updates

## Database Maintenance Files

### `cleanup_game_tables.sql`
**Purpose**: Clean up redundant game tables and consolidate data
**When to use**: When you have multiple game-related tables that need consolidation
**Contains**: 
- Drops redundant tables
- Migrates data to consolidated structure
- Updates foreign key constraints

### `cleanup_game_tables_fixed.sql`
**Purpose**: Fixed version of cleanup script with proper UUID handling
**When to use**: Same as above, but handles UUID types correctly

### `cleanup_multiplayer_data.sql`
**Purpose**: Clean up problematic multiplayer data causing 406 errors
**When to use**: When experiencing 406 errors in multiplayer games
**Contains**:
- Removes orphaned moves
- Cleans up duplicate moves
- Resets stuck game rooms

## Constraint Fixes

### `simple_constraint_fix.sql`
**Purpose**: Simple fix for player2_id foreign key constraint
**When to use**: When single-player games fail to save due to constraint errors

### `fix_constraint_only.sql`
**Purpose**: Alternative constraint fix approach
**When to use**: If simple_constraint_fix.sql doesn't work

### `debug_constraint_fix.sql`
**Purpose**: Comprehensive constraint debugging and fixing
**When to use**: When experiencing persistent constraint issues
**Contains**:
- Detailed error checking
- Multiple fix approaches
- Verification steps

### `fix_game_records_constraint.sql`
**Purpose**: Specific fix for game_records table constraints
**When to use**: When game_records table has constraint issues

## Multiplayer Fixes

### `fix_multiplayer_issues.sql`
**Purpose**: Comprehensive fix for multiplayer game issues
**When to use**: When multiplayer games have 406 errors or round management problems
**Contains**:
- RLS policy fixes
- Round management improvements
- Game state consistency fixes

### `simple_rls_fix.sql`
**Purpose**: Simple RLS policy fix for game_moves table
**When to use**: When experiencing 406 errors in multiplayer games
**Contains**:
- Drops problematic RLS policies
- Creates simpler, more permissive policies

### `disable_rls_test.sql`
**Purpose**: Temporarily disable RLS for testing
**When to use**: To test if RLS is causing 406 errors
**Contains**:
- Disables RLS on game_moves table
- Test queries to verify functionality

## Schema Updates

### `simple_schema_update.sql`
**Purpose**: Safe schema updates without dropping tables
**When to use**: When you need to add columns or constraints to existing tables
**Contains**:
- Safe ALTER TABLE statements
- Data migration scripts
- Constraint updates

### `update_game_moves_table.sql`
**Purpose**: Specific updates to game_moves table
**When to use**: When game_moves table needs modifications

### `comprehensive_fix.sql`
**Purpose**: Comprehensive database fixes
**When to use**: When multiple issues need to be addressed
**Contains**:
- Multiple table fixes
- Constraint updates
- Data cleanup

## Usage Instructions

1. **Initial Setup**: Run `database_schema.sql` first
2. **If you have existing data**: Run `cleanup_game_tables_fixed.sql` to consolidate
3. **If experiencing 406 errors**: Run `simple_rls_fix.sql`
4. **If constraint issues**: Run `debug_constraint_fix.sql`
5. **For testing**: Use `disable_rls_test.sql` to temporarily disable RLS

## Important Notes

- Always backup your database before running these scripts
- Run scripts in the order listed above
- Some scripts may need to be run multiple times if errors occur
- The `disable_rls_test.sql` script should only be used for testing, not in production

## File Sizes and Complexity

- **Small files** (< 1KB): Simple fixes and constraints
- **Medium files** (1-5KB): Cleanup and maintenance scripts
- **Large files** (> 5KB): Complete schema and comprehensive fixes

## Troubleshooting

If you encounter errors:
1. Check the error message for specific table/constraint names
2. Look for the corresponding fix file
3. Run the fix file and check for success
4. If issues persist, try the comprehensive fix files 