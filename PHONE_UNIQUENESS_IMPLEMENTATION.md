# Phone Number Uniqueness Constraint Implementation

## Overview
This implementation addresses Issue #92 by ensuring strict phone number uniqueness at the database level and handling collisions gracefully in the registration flow.

## Database Schema Changes

### Enhanced Users Table
```sql
-- Named unique constraints for better error handling
ALTER TABLE users ADD CONSTRAINT users_phone_number_unique UNIQUE (phone_number);
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);

-- Performance indexes
CREATE INDEX CONCURRENTLY users_status_idx ON users (status);
CREATE INDEX CONCURRENTLY users_created_at_idx ON users (created_at);
CREATE INDEX CONCURRENTLY users_phone_number_idx ON users (phone_number);
```

### Drizzle Schema Updates
```typescript
export const users = pgTable("users", {
  // ... existing fields
  phoneNumber: text("phone_number").unique(),
  // ... other fields
}, (table) => {
  return [
    unique("users_phone_number_unique").on(table.phoneNumber),
    unique("users_email_unique").on(table.email),
    unique("users_username_unique").on(table.username),
    index("users_status_idx").on(table.status),
    index("users_created_at_idx").on(table.createdAt),
  ];
});
```

## Registration Flow Enhancements

### 1. Pre-Registration Validation
- **Phone Number Format**: E.164 validation using `validateE164PhoneNumber()`
- **Phone Number Sanitization**: Auto-formatting using `sanitizePhoneNumber()`
- **Duplicate Check**: Database lookup before insertion

### 2. Database-Level Protection
- **Named Constraints**: Clear error identification
- **PostgreSQL Error Handling**: Code 23505 (unique violation)
- **Graceful Error Messages**: User-friendly responses

### 3. Enhanced Error Handling
```typescript
// PostgreSQL unique violation handling
if (error.code === '23505') {
  if (error.detail?.includes('phone_number')) {
    return NextResponse.json(
      { success: false, error: "Phone number already registered" },
      { status: 409 }
    );
  }
  // ... other constraint violations
}
```

## API Changes

### Registration Endpoint (`POST /api/auth/register`)
**New Features:**
- Accepts optional `phoneNumber` field
- Validates E.164 format
- Sanitizes phone numbers to standard format
- Checks for existing phone numbers
- Handles database unique violations

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phoneNumber": "+2348123456789" // Optional, E.164 format
}
```

**Response with Phone Number:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "user-123",
    "email": "user@example.com",
    "phoneNumber": "+2348123456789",
    "verificationInitiated": true
  }
}
```

## Repository Layer Updates

### Auth Repository (`src/server/db/authRepository.ts`)
**New Functions:**
- `findUserByPhoneNumber(phoneNumber: string)` - Lookup by phone
- Enhanced `createUser()` - Supports phone number parameter

**Enhanced Interfaces:**
```typescript
export interface RegisterUserInput {
  email: string;
  passwordHash: string;
  name?: string | null;
  phoneNumber?: string | null; // New
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null; // New
  role: string;
  status: string;
}
```

## Phone Number Format Support

### Nigerian Numbers (Auto-converted)
```
Input: "08123456789" → Stored: "+2348123456789"
Input: "09012345678" → Stored: "+2349012345678"
Input: "08098765432" → Stored: "+2348098765432"
```

### International Numbers (Preserved)
```
Input: "+447911234567" → Stored: "+447911234567"
Input: "+15551234567" → Stored: "+15551234567"
```

### Formatted Numbers (Cleaned)
```
Input: "+234-812-345-6789" → Stored: "+2348123456789"
Input: "+1 (555) 123-4567" → Stored: "+15551234567"
```

## Security Benefits

### 1. Identity Management
- **1:1 Relationship**: Each phone number maps to exactly one user
- **Account Recovery**: Secure phone-based recovery options
- **Fraud Prevention**: Multiple accounts with same phone prevented

### 2. Data Integrity
- **Database Constraints**: Enforced uniqueness at storage level
- **Application Checks**: Pre-insertion validation
- **Consistent Format**: All numbers stored in E.164 format

### 3. Error Handling
- **Specific Messages**: Clear indication of what caused registration failure
- **Constraint Identification**: Named constraints for precise error handling
- **Graceful Degradation**: Registration continues without phone if optional

## Performance Optimizations

### Database Indexes
- `users_phone_number_idx` - Fast phone number lookups
- `users_status_idx` - Efficient status filtering
- `users_created_at_idx` - Chronological queries

### Query Efficiency
- Indexed lookups for phone number searches
- Optimized registration validation queries
- Efficient duplicate detection

## Testing Coverage

### Unit Tests (`__tests__/server/db/authRepository.test.ts`)
- ✅ Phone number lookup functionality
- ✅ Unique constraint violation handling
- ✅ Registration with/without phone numbers
- ✅ Phone number sanitization
- ✅ Database error scenarios

### Integration Tests
- ✅ Registration API with phone numbers
- ✅ Duplicate prevention
- ✅ Error message accuracy
- ✅ E.164 format validation

## Migration Strategy

### Database Migration
```sql
-- File: drizzle/001_add_phone_unique_constraint.sql
-- Applies unique constraints and performance indexes
-- Handles existing data gracefully
```

### Rollback Plan
- Constraint removal scripts available
- Data backup recommendations
- Gradual rollout strategy

## Production Considerations

### Monitoring
- Log unique constraint violations
- Track registration failure reasons
- Monitor phone number format validation

### Scalability
- Indexes support high-volume lookups
- Efficient constraint checking
- Optimized for concurrent registrations

### Compliance
- GDPR-friendly phone number handling
- E.164 international standard compliance
- Secure storage of personal identifiers

## Benefits Achieved

### ✅ Database-Level Uniqueness
- PostgreSQL unique constraints enforce 1:1 phone-to-user mapping
- Named constraints provide clear error identification
- Performance indexes optimize query speed

### ✅ Application-Level Validation
- Pre-registration duplicate checking
- E.164 format enforcement
- Graceful error handling with user-friendly messages

### ✅ Enhanced Security
- Prevents multiple accounts with same phone
- Secure identity management
- Fraud prevention mechanism

### ✅ Developer Experience
- Clear error codes and messages
- Comprehensive test coverage
- Well-documented implementation

This implementation ensures robust phone number uniqueness while maintaining excellent user experience and system performance.
