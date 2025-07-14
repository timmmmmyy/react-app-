#!/usr/bin/env node

/**
 * Export Backend Data for Xano Migration
 * 
 * This script exports your current SQLite data and configuration
 * to help with the migration to Xano.
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('📦 Exporting backend data for Xano migration...\n');

// Configuration
const DB_PATH = path.join(__dirname, 'backend/database.sqlite');
const EXPORT_DIR = path.join(__dirname, 'xano-migration-data');

// Create export directory
if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

// Export database schema and data
function exportDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
                reject(err);
                return;
            }

            console.log('✅ Connected to SQLite database');

            // Export schema
            db.all("SELECT sql FROM sqlite_master WHERE type='table'", (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                const schema = rows.map(row => row.sql).join(';\n\n');
                fs.writeFileSync(path.join(EXPORT_DIR, 'database-schema.sql'), schema);
                console.log('📄 Exported database schema');

                // Export users data
                db.all("SELECT * FROM users", (err, users) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const usersData = {
                        count: users.length,
                        users: users.map(user => ({
                            id: user.id,
                            email: user.email,
                            is_confirmed: user.is_confirmed,
                            is_premium: user.is_premium,
                            stripe_customer_id: user.stripe_customer_id,
                            created_at: user.created_at,
                            confirmed_at: user.confirmed_at,
                            premium_purchased_at: user.premium_purchased_at
                        }))
                    };

                    fs.writeFileSync(
                        path.join(EXPORT_DIR, 'users-data.json'), 
                        JSON.stringify(usersData, null, 2)
                    );
                    console.log(`👥 Exported ${users.length} users`);

                    db.close();
                    resolve();
                });
            });
        });
    });
}

// Export environment variables
function exportEnvironment() {
    try {
        const envPath = path.join(__dirname, 'backend/.env');
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf8');
            
            // Create a template with sensitive data removed
            const templateContent = envContent
                .replace(/STRIPE_SECRET_KEY=.*/g, 'STRIPE_SECRET_KEY=your_stripe_secret_key_here')
                .replace(/JWT_SECRET=.*/g, 'JWT_SECRET=your_jwt_secret_here')
                .replace(/MAILGUN_API_KEY=.*/g, 'MAILGUN_API_KEY=your_mailgun_api_key_here')
                .replace(/MAILGUN_DOMAIN=.*/g, 'MAILGUN_DOMAIN=your_mailgun_domain_here');

            fs.writeFileSync(path.join(EXPORT_DIR, 'env-template.txt'), templateContent);
            console.log('⚙️  Exported environment template');
        }
    } catch (error) {
        console.log('⚠️  Could not export environment file');
    }
}

// Export API endpoints summary
function exportApiSummary() {
    const apiSummary = {
        endpoints: [
            {
                path: '/api/auth/register',
                method: 'POST',
                description: 'User registration with email confirmation',
                body: ['email', 'password', 'confirmPassword']
            },
            {
                path: '/api/auth/login',
                method: 'POST',
                description: 'User login with JWT token',
                body: ['email', 'password']
            },
            {
                path: '/api/auth/confirm-email',
                method: 'GET',
                description: 'Email confirmation',
                query: ['token']
            },
            {
                path: '/api/user/profile',
                method: 'GET',
                description: 'Get user profile (protected)',
                headers: ['Authorization: Bearer <token>']
            },
            {
                path: '/api/stripe/create-checkout',
                method: 'POST',
                description: 'Create Stripe checkout session',
                body: ['priceId'],
                headers: ['Authorization: Bearer <token>']
            },
            {
                path: '/api/stripe/webhook',
                method: 'POST',
                description: 'Stripe webhook handler',
                headers: ['stripe-signature']
            }
        ],
        middleware: [
            'JWT Authentication',
            'Rate Limiting',
            'CORS Configuration',
            'Input Validation'
        ],
        features: [
            'User Authentication',
            'Email Confirmation',
            'Stripe Payment Integration',
            'Premium User Management',
            'Trial Period Support'
        ]
    };

    fs.writeFileSync(
        path.join(EXPORT_DIR, 'api-summary.json'), 
        JSON.stringify(apiSummary, null, 2)
    );
    console.log('📋 Exported API endpoints summary');
}

// Generate migration checklist
function generateChecklist() {
    const checklist = `
# Xano Migration Checklist

## ✅ Pre-Migration
- [ ] Backup current backend data
- [ ] Export database schema and users
- [ ] Document current API endpoints
- [ ] Set up Xano account

## 🗄️ Database Setup
- [ ] Create users table in Xano
- [ ] Import existing users (if any)
- [ ] Set up database relationships
- [ ] Test database operations

## 🔐 Authentication Setup
- [ ] Create auth_register endpoint
- [ ] Create auth_login endpoint
- [ ] Create auth_confirm_email endpoint
- [ ] Set up JWT middleware
- [ ] Test authentication flow

## 💳 Stripe Integration
- [ ] Configure Stripe in Xano
- [ ] Create stripe_create_checkout endpoint
- [ ] Create stripe_webhook endpoint
- [ ] Test payment flow

## 📧 Email Setup
- [ ] Configure email provider in Xano
- [ ] Create email templates
- [ ] Test email sending

## 🔧 Environment & Configuration
- [ ] Set up environment variables
- [ ] Configure CORS settings
- [ ] Set up rate limiting
- [ ] Test all endpoints

## 🚀 Frontend Updates
- [ ] Update API base URL
- [ ] Test all frontend API calls
- [ ] Update environment variables
- [ ] Deploy updated frontend

## 🧹 Cleanup
- [ ] Remove old backend files
- [ ] Update deployment scripts
- [ ] Update documentation
- [ ] Monitor for issues

## 📊 Post-Migration
- [ ] Monitor application performance
- [ ] Check error logs
- [ ] Verify all features work
- [ ] Update team documentation
`;

    fs.writeFileSync(path.join(EXPORT_DIR, 'migration-checklist.md'), checklist);
    console.log('📝 Generated migration checklist');
}

// Main execution
async function main() {
    try {
        await exportDatabase();
        exportEnvironment();
        exportApiSummary();
        generateChecklist();

        console.log('\n🎉 Export complete!');
        console.log(`📁 Data exported to: ${EXPORT_DIR}`);
        console.log('\n📋 Files created:');
        console.log('   - database-schema.sql (database structure)');
        console.log('   - users-data.json (user data)');
        console.log('   - env-template.txt (environment variables template)');
        console.log('   - api-summary.json (API endpoints documentation)');
        console.log('   - migration-checklist.md (step-by-step checklist)');
        
        console.log('\n🚀 Next steps:');
        console.log('   1. Review the exported data');
        console.log('   2. Follow the migration guide in XANO_MIGRATION_GUIDE.md');
        console.log('   3. Use the checklist to track progress');
        console.log('   4. Test thoroughly before removing old backend');

    } catch (error) {
        console.error('❌ Export failed:', error.message);
        process.exit(1);
    }
}

main(); 