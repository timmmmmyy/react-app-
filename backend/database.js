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
        }
    });
}

initializeDatabase();

const dbOperations = {
    async createUser(email, passwordHash, confirmationToken) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO users (email, password_hash, confirmation_token) VALUES (?, ?, ?)`;
            db.run(sql, [email, passwordHash, confirmationToken], function(err) {
                if (err) {
                    return reject(err);
                }
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
                    CASE WHEN is_premium = 1 THEN 1 ELSE 0 END as is_premium,
                    stripe_customer_id,
                    stripe_payment_intent_id,
                    created_at,
                    confirmed_at,
                    premium_purchased_at,
                    trial_start_time
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
            const sql = `SELECT * FROM users WHERE confirmation_token = ?`;
            db.get(sql, [token], (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    },
    
    async updateConfirmationToken(userId, newToken) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET confirmation_token = ? WHERE id = ?`;
            db.run(sql, [newToken, userId], function(err) {
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
                    confirmation_token = NULL 
                WHERE confirmation_token = ? AND is_confirmed = 0
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

    async startTrial(email, trialStartTime) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET trial_start_time = ? WHERE email = ?`;
            db.run(sql, [trialStartTime, email], function(err) {
                if (err) return reject(err);
                resolve(this.changes > 0);
            });
        });
    },

    async grantPremiumAccess(email) {
        await connectToDatabase();
        return new Promise((resolve, reject) => {
            const sql = `UPDATE users SET is_premium = 1, premium_purchased_at = CURRENT_TIMESTAMP WHERE email = ?`;
            db.run(sql, [email], function(err) {
                if (err) {
                    console.error('Error granting premium access:', err);
                    return reject(err);
                }
                resolve(this.changes > 0);
            });
        });
    }
};

module.exports = dbOperations; 