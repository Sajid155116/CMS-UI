# Authentication Implementation

## Overview
This CMS uses **OAuth2-style access/refresh token** authentication with JWT tokens stored in localStorage and automatic token refresh.

## Authentication Flow

### 1. User Signup/Login
- User enters credentials on `/login` or `/signup` page
- Frontend calls backend `/users/login` or `/users/signup`
- Backend validates credentials and generates:
  - **Access Token**: JWT valid for 15 minutes
  - **Refresh Token**: JWT valid for 7 days
- Backend stores refresh token in database (for revocation capability)
- Backend returns: `{ accessToken, refreshToken, expiresIn, user }`
- Frontend stores tokens in localStorage
- User is redirected to `/files`

### 2. API Requests
- All API requests include: `Authorization: Bearer <accessToken>`
- API client automatically adds token from UserContext
- Backend AuthGuard verifies access token on every request
- If valid, request proceeds with userId extracted from token
- If invalid/expired, returns 401

### 3. Token Refresh (Automatic)
- Frontend refreshes token every 14 minutes (before 15-min expiry)
- On 401 error, automatically tries to refresh using refresh token
- Calls `/users/refresh` with refresh token
- Backend validates refresh token from database
- Generates new access/refresh token pair
- Revokes old refresh token
- Updates localStorage with new tokens
- Retries failed request with new access token

### 4. Logout
- User clicks "Sign Out"
- Frontend calls `/users/logout` with refresh token
- Backend revokes refresh token in database
- Frontend clears localStorage
- User redirected to `/login`

## Backend Components

### JWT Service (`src/common/services/jwt.service.ts`)
Handles all token operations:
```typescript
generateTokenPair(userId, email, name): { accessToken, refreshToken, expiresIn }
verifyAccessToken(token): TokenPayload
verifyRefreshToken(token): TokenPayload
```

**Token Structure:**
```json
{
  "sub": "userId",
  "email": "user@example.com",
  "name": "User Name",
  "type": "access" | "refresh",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### RefreshToken Schema (`src/users/schemas/refresh-token.schema.ts`)
Database model for refresh tokens:
- `userId`: User who owns the token
- `token`: JWT refresh token
- `expiresAt`: Expiration date (7 days)
- `revoked`: Boolean flag
- `revokedAt`: Revocation timestamp
- `createdByIp`: IP address (optional)

**Features:**
- TTL index automatically deletes expired tokens
- Unique index on token field
- Index on userId for fast lookup

### AuthGuard (`src/common/guards/auth.guard.ts`)
- Implements `CanActivate` interface
- Extracts Bearer token from Authorization header
- Verifies access token using JwtService
- Returns 401 for missing or invalid tokens
- Sets `request.user = { id, email, name }`

### CurrentUser Decorator (`src/common/decorators/current-user.decorator.ts`)
- Extracts user information from request
- Default returns `user.id`
- Can specify field: `@CurrentUser('email')`

### Users Controller Endpoints

**POST /users/login**
```typescript
Body: { email, password }
Response: { accessToken, refreshToken, expiresIn, user: { id, email, name } }
```

**POST /users/signup**
```typescript
Body: { email, password, name }
Response: { id, email, name }
```

**POST /users/refresh**
```typescript
Body: { refreshToken }
Response: { accessToken, refreshToken, expiresIn }
```

**POST /users/logout** (Protected)
```typescript
Headers: Authorization: Bearer <accessToken>
Body: { refreshToken }
Response: { message: 'Logged out successfully' }
```

**GET /users/preferences** (Protected)
```typescript
Headers: Authorization: Bearer <accessToken>
Response: { userId, viewMode, settings }
```

### Protected Controllers
All item routes protected with:
```typescript
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class ItemsController {
  create(@CurrentUser() userId: string) {
    // userId is automatically extracted from access token
  }
}
```

## Frontend Components

### UserContext (`src/contexts/UserContext.tsx`)
React Context for authentication state management:

**State:**
- `user`: User object `{ id, email, name }`
- `accessToken`: Current access token
- `refreshToken`: Current refresh token
- `loading`: Auth initialization loading state
- `isAuthenticated`: Boolean flag

**Methods:**
- `login(email, password)`: Login user
- `signup(email, password, name)`: Register new user
- `logout()`: Logout user and clear tokens
- `refreshAccessToken()`: Refresh access token

**Features:**
- Stores tokens in localStorage
- Automatic token refresh every 14 minutes
- Loads tokens on app initialization
- Redirects to login on token expiration

### API Client (`src/lib/api-client.ts`)
Axios instance with interceptors:

**Request Interceptor:**
- Automatically adds `Authorization: Bearer <accessToken>` header
- Gets token from UserContext via callback

**Response Interceptor:**
- Catches 401 errors
- Automatically refreshes token
- Retries failed request with new token
- Logout if refresh fails

**Initialization:**
```typescript
apiClient.initialize(
  () => accessToken,        // Token getter
  () => refreshAccessToken() // Refresh callback
);
```

### Protected Pages
Pages check authentication:
```typescript
const { user, isAuthenticated, loading } = useUser();

useEffect(() => {
  if (!loading && !isAuthenticated) {
    router.push('/login');
  }
}, [loading, isAuthenticated]);
```

## Database Schema

### Users Collection
- `_id`: MongoDB ObjectId
- `email`: String (unique, lowercase)
- `password`: String (bcrypt hashed)
- `name`: String
- `isActive`: Boolean (default: true)
- `createdAt`: Date
- `updatedAt`: Date

### RefreshTokens Collection
- `_id`: MongoDB ObjectId
- `userId`: String (indexed)
- `token`: String (unique)
- `expiresAt`: Date (TTL indexed)
- `revoked`: Boolean (default: false)
- `revokedAt`: Date
- `createdByIp`: String
- `createdAt`: Date
- `updatedAt`: Date

### Items Collection
All queries filtered by `userId`:
- `userId`: String (indexed)
- `name`: String
- `type`: 'file' | 'folder'
- `parentId`: String | null
- `storageKey`: String (for files)
- `size`: Number
- `mimeType`: String
- `path`: String
- `createdAt`: Date
- `updatedAt`: Date

## Environment Variables

### Backend (.env)
```env
# JWT Secrets (use strong random values)
JWT_ACCESS_SECRET=your-access-secret-here
JWT_REFRESH_SECRET=your-refresh-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here  # Fallback

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/CMS

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=cms-app-bucket-prod
R2_PUBLIC_URL=https://your-bucket.r2.cloudflarestorage.com
```

### Frontend (.env.local)
```env
# API URL
NEXT_PUBLIC_API_URL=https://cms-backend-production-c843.up.railway.app/api

# NextAuth (legacy, can be removed)
NEXTAUTH_URL=https://cms-frontend-tau-khaki.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here
AUTH_TRUST_HOST=true
```

## Security Features

1. **JWT Verification**: All access tokens verified on every request
2. **User Isolation**: All database queries filter by userId
3. **Token Expiration**: Short-lived access tokens (15 min)
4. **Token Refresh**: Long-lived refresh tokens (7 days) with revocation
5. **Token Storage**: Refresh tokens stored in database for revocation
6. **Automatic Cleanup**: TTL index removes expired tokens
7. **Password Hashing**: bcrypt with 10 rounds
8. **Bearer Token**: Standard OAuth2 authorization header
9. **Revocation**: Logout revokes all refresh tokens

## Testing Authentication

### 1. Test Login
```bash
curl -X POST https://cms-backend-production-c843.up.railway.app/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Expected Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": 900,
  "user": {
    "id": "123abc",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 2. Test Protected Route
```bash
# Without token - should return 401
curl https://cms-backend-production-c843.up.railway.app/api/items

# With token - should return user's items
curl -H "Authorization: Bearer eyJhbGc..." \
  https://cms-backend-production-c843.up.railway.app/api/items
```

### 3. Test Token Refresh
```bash
curl -X POST https://cms-backend-production-c843.up.railway.app/api/users/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGc..."}'
```

### 4. Test Logout
```bash
curl -X POST https://cms-backend-production-c843.up.railway.app/api/users/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGc..." \
  -d '{"refreshToken":"eyJhbGc..."}'
```

## Deployment

### Railway (Backend)
1. Push to GitHub - Railway auto-deploys
2. Set environment variables in Railway dashboard:
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `MONGODB_URI`
   - `R2_*` credentials
3. Check logs: `railway logs`

### Vercel (Frontend)
1. Deploy: `vercel --prod`
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL`
3. Environment variables are cached - redeploy after changes

## Troubleshooting

### 401 Unauthorized
**Symptom**: All API requests return 401
**Solutions**:
- Check access token is being sent in Authorization header
- Verify JWT_ACCESS_SECRET matches between frontend and backend
- Check token hasn't expired (15 minutes)
- Clear localStorage and login again
- Check Railway logs for detailed error

### Token Refresh Failed
**Symptom**: User logged out unexpectedly
**Solutions**:
- Check refresh token exists in database
- Verify refresh token hasn't been revoked
- Check refresh token hasn't expired (7 days)
- Verify JWT_REFRESH_SECRET is correct
- Clear localStorage and login again

### User Can See Other Users' Files
**Symptom**: Files from different users visible
**Solutions**:
- Check userId is being extracted from token correctly
- Verify all database queries filter by userId
- Check AuthGuard is enabled on all protected routes
- Review items.service.ts queries

### Automatic Refresh Not Working
**Symptom**: User gets logged out after 15 minutes
**Solutions**:
- Check refresh interval is set (14 minutes)
- Verify refresh token endpoint works
- Check localStorage has refresh token
- Review browser console for errors

## Migration from NextAuth

**What Changed:**
- ❌ Removed: `next-auth` dependency
- ❌ Removed: Cookie-based sessions
- ❌ Removed: `/api/auth/[...nextauth]` routes
- ✅ Added: JWT access/refresh tokens
- ✅ Added: UserContext for state management
- ✅ Added: localStorage token storage
- ✅ Added: Automatic token refresh

**Benefits:**
- Full control over authentication flow
- Standard OAuth2 pattern
- Better token management
- Explicit token expiration
- Token revocation capability
- Clearer security model
- No cookie complexity

## Future Enhancements

1. **Remember Me**: Optional 30-day refresh tokens
2. **Multi-Device Management**: List and revoke tokens per device
3. **Session Activity**: Track last login, IP addresses
4. **2FA**: Two-factor authentication
5. **Password Reset**: Email-based password recovery
6. **OAuth Providers**: Google, GitHub login
7. **Rate Limiting**: Prevent brute force attacks
8. **Audit Log**: Track authentication events
