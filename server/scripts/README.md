# Database Scripts

This directory contains scripts for database operations including seeding and migration.

## Database Seeding

The `seedDatabase.js` script populates your database with comprehensive test data for all aspects of the Whisprr application.

### Usage

```bash
# Seed database with test data (preserves existing data)
npm run seed

# Clear existing data and seed fresh
npm run seed:clear
```

### What Gets Seeded

The script creates realistic test data for all major entities:

#### Users (27 total)
- **2 Admin Users**: Full admin privileges with system management access
- **5 Counselor Users**: Professional counselors with different verification statuses
  - 3 Verified counselors (approved)
  - 1 Pending verification
  - 1 Unsubmitted verification
- **20 Regular Users**: Mix of registered and anonymous users
  - 15 registered users with profiles
  - 5 anonymous users

#### Groups (10 total)
Support groups covering various topics:
- Depression Support Group
- Anxiety Warriors  
- Relationship Advice
- Career Guidance
- Addiction Recovery
- Stress Management
- Family Support
- Teen Support Circle
- Grief and Loss
- Self-Care Sanctuary

#### Sessions (30 total)
Counseling sessions with various statuses:
- Scheduled sessions
- Completed sessions with feedback
- Cancelled sessions
- In-progress sessions

#### Messages (100+ total)
- Direct messages between users
- Group messages within support groups
- Various message types (text, media, system)
- Realistic conversation patterns

#### Resources (10 total)
Educational content including:
- Articles on mental health topics
- Video guides and tutorials
- Audio meditations
- Downloadable worksheets
- Crisis support information

#### Notifications (100+ total)
Various notification types:
- Message notifications
- Group invitations
- Session reminders
- System announcements
- Crisis alerts
- Account updates

### Test Credentials

After seeding, you can use these test accounts:

```
Admin Account:
Email: admin1@whisprr.com
Password: Admin123!

Counselor Account:
Email: counselor1@whisprr.com  
Password: Counselor123!

Regular User Account:
Email: user1@example.com
Password: User123!
```

### Features Demonstrated

The seeded data showcases:

✅ **Role-based Access Control**: Admin, counselor, and user roles with different permissions  
✅ **Group Management**: Active support groups with members and conversations  
✅ **Session Scheduling**: Counseling appointments in various states  
✅ **Messaging System**: Encrypted direct and group messaging  
✅ **Notification System**: Comprehensive notification types and priorities  
✅ **Resource Library**: Educational content with categorization  
✅ **User Verification**: Counselor verification workflow  
✅ **Anonymous Users**: Privacy-focused anonymous user accounts  
✅ **Realistic Data**: Names, messages, and interactions that feel authentic

### Data Relationships

The script maintains proper relationships between entities:
- Users are members of groups
- Messages reference senders and recipients/groups
- Sessions link counselors with clients
- Notifications reference related entities
- Resources have authors and categories

### Development vs Production

This script is designed for development and testing environments. It:
- Creates predictable test accounts for easy testing
- Generates realistic but fake data
- Maintains referential integrity
- Includes edge cases and various states

**⚠️ Important**: Never run this script in a production environment as it will create test data that should not exist in a live system.

### Customization

You can modify the script to:
- Change the number of entities created
- Adjust the types of test data
- Add new sample content
- Modify user roles and permissions
- Include additional test scenarios

The script is well-documented with inline comments explaining each section and can be easily extended for specific testing needs.