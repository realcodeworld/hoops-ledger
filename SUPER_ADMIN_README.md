# Super Admin Portal

The Super Admin Portal is a SaaS-level administration module that provides complete control over all users across all organizations.

## Features

- **Separate Login System**: Independent authentication from regular users
- **User Management**: View all users across all organizations
- **Password Management**: Update any user's password
- **User Editing**: Update user details (name, email, role)
- **User Creation**: Create new users for any organization
- **User Deletion**: Remove user accounts

## Access

### Login URL
```
http://localhost:3000/super-admin/login
```

### Default Credentials
```
Email: superadmin@hoops.com
Password: SuperAdmin123!
```

**IMPORTANT**: Change the default password immediately after first login!

## Routes

- `/super-admin/login` - Super admin login page
- `/super-admin/users` - User management dashboard
- `/super-admin/users/new` - Create new user

## Security Features

- Separate authentication system from regular users
- HTTP-only cookies for session management
- Password hashing using bcryptjs
- Role-based access (admin/supervisor)
- Session timeout (7 days)

## Creating Additional Super Admins

To create additional super admin accounts, run:

```bash
npx tsx prisma/seed-super-admin.ts
```

Then manually update the email in the database or modify the seed script.

## Database

Super admins are stored in the `super_admins` table with the following fields:
- `id`: Unique identifier
- `name`: Full name
- `email`: Login email (unique)
- `passwordHash`: Hashed password
- `createdAt`: Account creation timestamp
- `updatedAt`: Last update timestamp
- `lastLoginAt`: Last login timestamp

## Management Capabilities

### View All Users
- See complete list of all users across all organizations
- View user details: name, email, organization, role, last login
- Organized by organization and email

### Update Passwords
- Reset any user's password
- Minimum 8 characters required
- Immediate effect

### Edit Users
- Update user name
- Update user email
- Change user role (admin/supervisor)
- Email uniqueness validation

### Create Users
- Add new users to any organization
- Set initial password
- Assign role
- Email uniqueness validation

### Delete Users
- Permanently remove user accounts
- Confirmation dialog for safety
- Cannot be undone

## Development

The super admin module consists of:

### Backend
- `lib/super-admin-auth.ts` - Authentication utilities
- `lib/actions/super-admin.ts` - Server actions
- `prisma/schema.prisma` - SuperAdmin model
- `prisma/seed-super-admin.ts` - Seed script

### Frontend
- `app/super-admin/layout.tsx` - Main layout with navigation
- `app/super-admin/login/` - Login page
- `app/super-admin/users/` - User management pages
- `app/super-admin/users/new/` - New user creation

## Production Considerations

1. **Change Default Password**: Update the super admin password immediately
2. **Environment Variables**: Ensure `SESSION_SECRET` is set to a strong random value
3. **HTTPS**: Always use HTTPS in production
4. **IP Whitelisting**: Consider restricting access to specific IP addresses
5. **Audit Logging**: Monitor super admin actions
6. **Two-Factor Authentication**: Consider adding 2FA for super admins
7. **Rate Limiting**: Implement rate limiting on login attempts

## Troubleshooting

### Cannot Login
- Verify credentials
- Check database connection
- Ensure super admin exists in database

### Session Issues
- Clear browser cookies
- Check `SESSION_SECRET` in .env
- Verify cookie settings in production

### Permission Errors
- Ensure you're logged in as super admin
- Check session cookie is set
- Verify database permissions
