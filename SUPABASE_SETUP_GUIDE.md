# Supabase Setup Guide for Clueso

## ✅ Configuration Complete

Your Supabase integration is now configured and ready to use!

### 📋 What's Been Set Up

1. **Environment Variables**
   - Backend: `Clueso_Node_layer-main/.env` ✅
   - Frontend: `Clueso_Frontend_layer-main/.env.local` ✅

2. **Client Configuration**
   - Backend: `src/config/supabase.js` ✅
   - Frontend: `lib/supabase.ts` ✅

3. **Connection Testing** ✅
   - Auth service working
   - API keys validated

### 🔧 Final Setup Step

To complete the setup, you need to create the database schema:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `rqbnpangmcppgeiqocfr`
3. Navigate to **SQL Editor**
4. Copy and run the SQL from: `Clueso_Node_layer-main/database/supabase-schema.sql`

### 🚀 Usage Examples

#### Backend (Node.js)
```javascript
const { supabaseClient, supabaseAdmin } = require('./src/config/supabase');

// For user operations (with RLS)
const { data, error } = await supabaseClient
  .from('users')
  .select('*')
  .eq('id', userId);

// For admin operations (bypasses RLS)
const { data, error } = await supabaseAdmin
  .from('users')
  .insert({ email, full_name });
```

#### Frontend (Next.js)
```typescript
import { supabase, authAPI } from '@/lib/supabase';

// Direct Supabase operations
const { data, error } = await supabase
  .from('projects')
  .select('*');

// Auth operations (uses your backend API)
const result = await authAPI.login(email, password);
```

### 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Service Role Key** for admin operations
- **Anon Key** for client operations
- **JWT Authentication** integrated

### 📊 Database Schema

The schema includes tables for:
- **Users** - User profiles and authentication
- **Projects** - User projects and workspaces
- **Recording Sessions** - Audio/video recording data
- **Collaboration Sessions** - Real-time collaboration
- **Files** - File uploads and storage
- **AI Analysis** - AI processing results

### 🛠️ Available Scripts

- `node setup-supabase.js` - Test connection and setup status
- `node test-supabase-connection.js` - Basic connection test

### 🔗 Your Supabase Details

- **URL**: `https://rqbnpangmcppgeiqocfr.supabase.co`
- **Project ID**: `rqbnpangmcppgeiqocfr`
- **Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)

---

**Next**: Run the SQL schema in your Supabase dashboard to complete the setup!