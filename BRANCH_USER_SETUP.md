# Branch User Setup Guide

## Overview
This guide explains how to create and manage branch users in the Abeer CRM system.

## User Roles
- **Chairman**: Full system access
- **Company Admin** (Backend: 'admin'): Can manage branches and company-wide settings
- **Branch Head** (Backend: 'manager'): Can manage their specific branch operations
- **Staff**: Limited access to own tasks and attendance
- **Client**: Can view own bookings and payments

## Creating Branch Users

### Method 1: Using the Demo Script
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the demo users creation script:
   ```bash
   node scripts/createDemoUsers.js
   ```

   This will create a branch user with:
   - Email: `branch@photoerp.com`
   - Password: `branch123`
   - Role: Branch Head

### Method 2: Using the Branch User Script
1. First, ensure you have branches created:
   ```bash
   node scripts/createDemoCompanies.js
   ```

2. Create a branch user:
   ```bash
   node scripts/createBranchUser.js
   ```

### Method 3: Manual Creation via API
Send a POST request to `/api/auth/register` with:
```json
{
  "name": "Branch Manager Name",
  "email": "branch@example.com",
  "password": "securepassword",
  "phone": "+1234567890",
  "role": "manager"
}
```

## Branch User Features

### What Branch Users Can Access:
- ✅ Dashboard (branch-specific data)
- ✅ Staff Management (their branch staff only)
- ✅ Bookings (their branch bookings)
- ✅ Client Management (their branch clients)
- ✅ Finance (their branch finances)
- ✅ Inventory (their branch inventory)
- ✅ Rentals (their branch rentals)
- ✅ Attendance (their branch attendance)
- ✅ Quotations (their branch quotations)
- ✅ Tasks (their branch tasks)
- ✅ Production Workflow
- ✅ Vendor Management
- ✅ Advanced Analytics (branch data)

### What Branch Users Cannot Access:
- ❌ Branch Management (only Chairman and Company Admin)
- ❌ Company-wide settings
- ❌ Other branches' data

## Login Process
Branch users can login using their email and password through the standard login page. The system will automatically:
1. Authenticate the user
2. Map their backend role ('manager') to frontend role ('branch_head')
3. Show only relevant menu items in the sidebar
4. Display branch-specific data in all components

## Testing Branch Login
1. Use the demo branch user credentials:
   - Email: `branch@photoerp.com`
   - Password: `branch123`

2. Verify that:
   - Branch Management is NOT visible in the sidebar
   - All other relevant features are accessible
   - Data is filtered to show only branch-specific information

## Troubleshooting
- If branch users can't see expected data, ensure they are properly assigned to a branch in the database
- Check that the role mapping is working correctly in the AuthContext
- Verify that API endpoints properly filter data based on user branch
