const sqlite3 = require('sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

let db;

function connectToDatabase() {
    return new Promise((resolve, reject) => {
        if (db) {
            resolve();
            return;
        }

        const newDb = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to SQLite database.');
                db = newDb;
                resolve();
            }
        });
    });
}

async function initializeDatabase() {
    await connectToDatabase();
    const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_confirmed BOOLEAN DEFAULT 0,
            confirmation_token TEXT,
            email_verification_expires_at DATETIME,
            is_premium BOOLEAN DEFAULT 0,
            stripe_customer_id TEXT,
            stripe_payment_intent_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            confirmed_at DATETIME,
            premium_purchased_at DATETIME,
            trial_start_time DATETIME
        )
    `;
    
    db.run(createUsersTable, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready.');
            // Add email_verification_expires_at column if it doesn't exist
            db.all(`PRAGMA table_info(users)`, (err, rows) => {
                if (err) {
                    console.error('Error checking table info:', err.message);
                    return;
                }
                // Ensure rows is an array before calling .some()
                if (!Array.isArray(rows)) {
                    console.error('PRAGMA table_info did not return an array for rows:', rows);
                    return;
                }
                const columnExists = rows.some(row => row.name === 'email_verification_expires_at');
                if (!columnExists) {
                    db.run(`ALTER TABLE users ADD COLUMN email_verification_expires_at DATETIME`, (alterErr) => {
                        if (alterErr) {
                            console.error('Error adding email_verification_expires_at column:', alterErr.message);
                        } else {
                            console.log('Added email_verification_expires_at column to users table.');
                        }
                    });
                }
            });
        }
    });

    const createPurchasesTable = `
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            stripe_payment_intent_id TEXT NOT NULL,
            stripe_customer_id TEXT,
            amount INTEGER NOT NULL,
            currency TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    `;

    db.run(createPurchasesTable, (err) => {
        if (err) {
            console.error('Error creating purchases table:', err.message);
        } else {
            console.log('Purchases table ready.');
        }
    });
}

initializeDatabase();

const dbOperations = {
    async createUser(email, passwordHash, confirmationToken) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (email, password_hash, confirmation_token, email_verification_expires_at) VALUES (?, ?, ?, ?)`;
            const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours from now
            console.log(`[CREATE USER] Creating user: ${email} with token: ${confirmationToken} expires: ${expiresAt}`);
            db.run(sql, [email, passwordHash, confirmationToken, expiresAt], function(err) {
                if (err) {
                    console.error('[CREATE USER] Error:', err);
                    return reject(err);
                }
                console.log(`[CREATE USER] User created with ID: ${this.lastID}`);
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, row) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(row);
                });
            });
        });
    },
    
    async findUserByEmail(email) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT 
                    id,
                    email,
                    password_hash,
                    CASE WHEN is_confirmed = 1 THEN 1 ELSE 0 END as is_confirmed,
                    confirmation_token,
                    email_verification_expires_at, -- Include this field
                    CASE WHEN is_premium = 1 THEN 1 ELSE 0 END as is_premium,
                    stripe_customer_id,
                    stripe_payment_intent_id,
                    created_at,
                    confirmed_at,
                    premium_purchased_at,
                    trial_start_time,
                    CASE WHEN is_premium = 1 THEN 1 ELSE 0 END as has_lifetime_access
                FROM users 
                WHERE email = ?
            `;
            db.get(sql, [email], (err, row) => {
                if (err) {
                    return reject(err);
                }
                if (row) {
                    // Ensure boolean fields are actually booleans (handle both number and string)
                    row.is_confirmed = row.is_confirmed === 1 || row.is_confirmed === "1";
                    row.is_premium = row.is_premium === 1 || row.is_premium === "1";
                }
                resolve(row);
            });
        });
    },

    async findUserById(id) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE id = ?`;
            db.get(sql, [id], (err, row) => {
                if (err) {
                    return reject(err);
                }
                if (row) {
                    row.has_lifetime_access = row.is_premium === 1 || row.is_premium === "1";
                }
                resolve(row);
            });
        });
    },
    
    async findUserByConfirmationToken(token) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            if (!token) {
                return reject(new Error('Token is required'));
            }
            // Check for user with token, not confirmed (NULL or 0), and either no expiry or not expired
            const sql = `SELECT * FROM users WHERE confirmation_token = ? AND (is_confirmed IS NULL OR is_confirmed = 0) AND (email_verification_expires_at IS NULL OR email_verification_expires_at > CURRENT_TIMESTAMP)`;
            console.log(`[DEBUG] Searching for token: ${token}`);
            db.get(sql, [token], (err, row) => {
                if (err) {
                    console.error('[DEBUG] Database error:', err);
                    return reject(err);
                }
                if (row) {
                    console.log(`[DEBUG] Found user with token: ${row.email}`);
                } else {
                    console.log(`[DEBUG] No user found with token: ${token}`);
                }
                resolve(row);
            });
        });
    },
    
    async updateConfirmationToken(userId, newToken, expiresAt) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET confirmation_token = ?, email_verification_expires_at = ? WHERE id = ?`;
            db.run(sql, [newToken, expiresAt, userId], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes > 0);
            });
        });
    },

    async confirmUser(token) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            if (!token) {
                console.error('confirmUser called with null/undefined token');
                return reject(new Error('Token is required'));
            }
            
            console.log('Confirming user with token:', token);
            const sql = `
                UPDATE users 
                SET 
                    is_confirmed = 1, 
                    confirmed_at = CURRENT_TIMESTAMP, 
                    confirmation_token = NULL, 
                    email_verification_expires_at = NULL 
                WHERE confirmation_token = ? AND (is_confirmed IS NULL OR is_confirmed = 0)
            `;
            
            db.run(sql, [token], function(err) {
                if (err) {
                    console.error('Database error in confirmUser:', err);
                    return reject(err);
                }
                if (this.changes === 0) {
                    console.log('No user was updated with token:', token);
                } else {
                    console.log('Successfully confirmed user. Rows affected:', this.changes);
                }
                resolve(this.changes > 0);
            });
        });
    },
    
    async upgradeToPremium(email, stripeCustomerId, stripePaymentIntentId) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_premium = 1, stripe_customer_id = ?, stripe_payment_intent_id = ?, premium_purchased_at = CURRENT_TIMESTAMP WHERE email = ?`;
            db.run(sql, [stripeCustomerId, stripePaymentIntentId, email], function(err) {
                if (err) {
                    return reject(err);
                }
                resolve(this.changes > 0);
            });
        });
    },
    
    async getUserStats() {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `SELECT 
                COUNT(*) as total_users,
                SUM(is_confirmed) as confirmed_users,
                SUM(is_premium) as premium_users
                FROM users`;
            db.get(sql, [], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    },

    async deleteAllUsers() {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `DELETE FROM users`;
            db.run(sql, [], function(err) {
                if (err) {
                    console.error('Error deleting users:', err);
                    return reject(err);
                }
                console.log(`Successfully deleted ${this.changes} users`);
                resolve(this.changes);
            });
        });
    },

    async verifyPassword(password, hash) {
        const bcrypt = require('bcryptjs');
        return bcrypt.compare(password, hash);
    },

    // Wrapper for backward compatibility (expects userId)
    async updateUserTrialStart(userId, trialStartTime) {
        return this.updateUserTrialStartById(userId, trialStartTime);
    },

    async updateUserTrialStartById(userId, trialStartTime) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET trial_start_time = ? WHERE id = ?`;
            db.run(sql, [trialStartTime, userId], function(err) {
                if (err) return reject(err);
                resolve(this.changes > 0);
            });
        });
    },

    async updateUserLifetimeAccess(userId, hasLifetimeAccess) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_premium = ?, premium_purchased_at = CURRENT_TIMESTAMP WHERE id = ?`;
            db.run(sql, [hasLifetimeAccess ? 1 : 0, userId], function(err) {
                if (err) return reject(err);
                resolve(this.changes > 0);
            });
        });
    },

    async findAllUnverifiedUsers() {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM users WHERE is_confirmed = 0`;
            db.all(sql, [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    },

    async createPurchase(userId, stripePaymentIntentId, stripeCustomerId, amount, currency, status) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO purchases (user_id, stripe_payment_intent_id, stripe_customer_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)`;
            db.run(sql, [userId, stripePaymentIntentId, stripeCustomerId, amount, currency, status], function(err) {
                if (err) return reject(err);
                resolve(this.lastID);
            });
        });
    },

    async getUserPurchases(userId) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM purchases WHERE user_id = ?`;
            db.all(sql, [userId], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    },

    async getUserLifetimeAccessStatus(email) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `SELECT is_premium as has_lifetime_access FROM users WHERE email = ?`;
            db.get(sql, [email], (err, row) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    },

    async updateUserStripeCustomerId(userId, stripeCustomerId) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET stripe_customer_id = ? WHERE id = ?`;
            db.run(sql, [stripeCustomerId, userId], function(err) {
                if (err) return reject(err);
                resolve(this.changes > 0);
            });
        });
    }
};

module.exports = dbOperations;