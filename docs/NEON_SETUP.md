# Neon Database Setup Guide

## Environment Variables Required

Create a `.env.local` file in your project root with these variables:

```env
# Neon Database (will be automatically set by Vercel)
DATABASE_URL="postgresql://username:password@hostname/database?sslmode=require"

# JWT Secret for authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Pi Network (existing)
PI_NETWORK_API_KEY="your-pi-api-key"
```

## Vercel Setup Steps

1. **Go to Vercel Dashboard**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Select your "dynamic-wallet-view" project

2. **Connect Neon Database**
   - Click on your project
   - Go to **"Storage"** tab
   - Click **"Connect Database"**
   - Select **"Neon"**
   - Configure project name and region
   - Click **"Create"**

3. **Environment Variables in Vercel**
   - Go to **"Settings"** → **"Environment Variables"**
   - Add `JWT_SECRET` with a secure random string
   - `DATABASE_URL` will be automatically added by Vercel

## Local Development Setup

1. **Install Dependencies** (already done): ```bash
   npm install prisma @prisma/client @neondatabase/serverless bcryptjs jsonwebtoken
   npm install --save-dev @types/bcryptjs @types/jsonwebtoken
   ```


2. **Initialize Prisma** (already done):

   ```bash
   npx prisma init
   ```

3. **Generate Prisma Client**:

   ```bash
   npx prisma generate
   ```

4. **Create Database Migration**:

   ```bash
   npx prisma migrate dev --name init
   ```

5. **Seed Database** (optional):

   ```bash
   npx prisma db seed
   ```

## Database Schema

The Prisma schema (`prisma/schema.prisma`) includes:

- **User**: Main user profiles with Pi Network data
- **UserSettings**: User preferences and settings
- **BalanceBreakdown**: Detailed balance information
- **UnverifiedPiDetails**: Unverified Pi sources
- **Badge**: Available badges
- **UserBadge**: User-badge relationships
- **TeamMember**: Team member information
- **NodeData**: Node operator data
- **Transaction**: Transaction history
- **Notification**: User notifications
- **BalanceHistory**: Historical balance data

## Next Steps

1. **Test Database Connection**
2. **Create API Routes** for database operations
3. **Migrate from localStorage** to database
4. **Implement Authentication** with JWT
5. **Add Real-time Features**

## Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database in browser
npx prisma studio

# Push schema changes (for development)
npx prisma db push
```
