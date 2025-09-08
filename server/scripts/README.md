# Database Scripts

This directory contains utility scripts for managing the Whisprr database.

## Available Scripts

### Seeding Script (`seed.js`)

Seeds the database with comprehensive sample data for development and testing.

**Usage:**
```bash
npm run seed
```

**What it creates:**
- **Users**: 10 sample users including admins, moderators, counselors, and regular users
- **Conversations**: 15+ private conversations with messages
- **Groups**: 8 support groups with members
- **Messages**: 50+ realistic chat messages
- **Reports**: 20 user/content reports with various statuses
- **Content Flags**: 15 flagged content items for moderation
- **Counselor Applications**: 8 counselor applications in different stages
- **Resources**: 4 mental health resources (articles, videos, worksheets)
- **User Relationships**: Contacts and blocked users

**Sample Login Credentials (username / password):**
- **Admin**: admin_user / password123
- **Moderator**: mod_user / password123
- **Counselor**: counselor_1 / password123
- **User**: user_001 / password123

### Backup Script (`backup.js`)

Creates a backup of the entire database using mongodump.

**Usage:**
```bash
npm run backup
```

**Features:**
- Creates timestamped backups in `./backups/` directory
- Uses mongodump for complete database export
- Preserves all collections and indexes

### Migration Script (`migrate.js`)

Runs database migrations to update schema and data.

**Usage:**
```bash
npm run migrate          # Run all migrations
npm run migrate rollback # Rollback all migrations
```

**Current Migrations:**
1. Add missing indexes to User model
2. Ensure all users have valid roles

## Prerequisites

- MongoDB server running locally or accessible via connection string
- Node.js environment with all dependencies installed
- For backups: `mongodump` tool installed (part of MongoDB tools)

## Configuration

Scripts read configuration from environment variables:
- `MONGODB_URI`: Database connection string (defaults to `mongodb://localhost:27017/whisprr`)

## Notes

- ⚠️ **Seeding will clear all existing data** - only use in development
- Backups are created in the `./backups/` directory
- All scripts include comprehensive logging and error handling
- Scripts can be imported and used programmatically in other modules

## Development Tips

1. **First Time Setup**:
   ```bash
   npm run seed    # Populate with sample data
   npm run migrate # Run any pending migrations
   ```

2. **Before Major Changes**:
   ```bash
   npm run backup  # Create backup first
   ```

3. **Reset Development Environment**:
   ```bash
   npm run seed    # Will clear and repopulate everything
   ```

## Troubleshooting

- **Connection Issues**: Check MongoDB is running and `MONGODB_URI` is correct
- **Permission Issues**: Ensure MongoDB user has read/write permissions
- **Backup Failures**: Install MongoDB database tools (`mongodump`/`mongorestore`)
- **Import Errors**: Verify all model files exist and are properly exported