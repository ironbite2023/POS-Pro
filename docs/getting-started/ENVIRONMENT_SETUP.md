# Environment Setup Guide

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://axlhezpjvyecntzsqczk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4bGhlenBqdnllY250enNxY3prIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3NzI4NDMsImV4cCI6MjA3NTM0ODg0M30.l2Dg7KM1Cl4xcJ7fTxQ7vuDDfM3gyq00LhxT3m-WJvU
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_from_dashboard

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Stripe Configuration (for payment processing)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Third-Party Delivery Platforms (Optional - for integrations)
UBER_EATS_API_KEY=your_uber_eats_api_key
UBER_EATS_STORE_ID=your_uber_eats_store_id

DELIVEROO_API_KEY=your_deliveroo_api_key
DELIVEROO_RESTAURANT_ID=your_deliveroo_restaurant_id

JUST_EAT_API_KEY=your_just_eat_api_key
JUST_EAT_RESTAURANT_ID=your_just_eat_restaurant_id

# Redis Configuration (for caching and rate limiting)
REDIS_URL=redis://localhost:6379

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@pospro.com

# Encryption
ENCRYPTION_SECRET=your_32_character_encryption_secret_key_here

# JWT Secret for API authentication
JWT_SECRET=your_jwt_secret_key_minimum_32_characters_long
```

## Setup Instructions

1. Copy the above configuration to `.env.local` in your project root
2. Update `SUPABASE_SERVICE_ROLE_KEY` from your Supabase dashboard (Settings > API)
3. For Stripe integration, create an account at https://stripe.com and get your keys
4. Other integrations are optional and can be configured later

## Development vs Production

For production, set these in your deployment platform (Vercel, etc.):
- Update `NEXT_PUBLIC_APP_URL` to your production domain
- Use production keys for Stripe and other services
- Set `NODE_ENV=production`
