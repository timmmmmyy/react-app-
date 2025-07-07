const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Create database connection
const dbPath = path.join(__dirname, '../data/users.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          trial_start_time INTEGER,
          has_lifetime_access BOOLEAN DEFAULT 0,
          stripe_customer_id TEXT,
          email_verified BOOLEAN DEFAULT 0,
          email_verification_token TEXT,
          email_verification_expires_at DATETIME
        )
      `, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        } else {
          console.log('✅ Users table initialized');
          resolve();
        }
      });

      // Sessions table for JWT blacklist/management
      db.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token_hash TEXT NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);

      // Purchases table for lifetime access tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS purchases (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          stripe_session_id TEXT,
          stripe_payment_intent_id TEXT,
          amount INTEGER NOT NULL,
          plan_type TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `);
    });
  });
};

// User management functions
const createUser = async (email, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const userId = uuidv4();
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      db.run(
        'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [userId, email.toLowerCase(), passwordHash],
        function(err) {
          if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              reject(new Error('Email already exists'));
            } else {
              reject(err);
            }
          } else {
            resolve({
              id: userId,
              email: email.toLowerCase()
            });
          }
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};

const findUserByEmail = (email) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [email.toLowerCase()],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

const findUserById = (id) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      }
    );
  });
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

const updateUserEmailVerificationToken = (userId, token, expiresAt) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET email_verification_token = ?, email_verification_expires_at = ? WHERE id = ?',
      [token, expiresAt, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      }
    );
  });
};

const verifyUserEmail = (token) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email_verification_token = ? AND email_verification_expires_at > datetime("now")',
      [token],
      (err, row) => {
        if (err) {
          reject(err);
        } else if (!row) {
          reject(new Error('Invalid or expired verification token'));
        } else {
          // Update user as verified
          db.run(
            'UPDATE users SET email_verified = 1, email_verification_token = NULL, email_verification_expires_at = NULL WHERE id = ?',
            [row.id],
            function(err) {
              if (err) {
                reject(err);
              } else {
                resolve(row);
              }
            }
          );
        }
      }
    );
  });
};

const updateUserTrialStart = (userId, trialStartTime) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET trial_start_time = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [trialStartTime, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      }
    );
  });
};

const updateUserLifetimeAccess = (userId, hasLifetimeAccess) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET has_lifetime_access = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hasLifetimeAccess ? 1 : 0, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      }
    );
  });
};

const updateUserStripeCustomerId = (userId, stripeCustomerId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET stripe_customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [stripeCustomerId, userId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      }
    );
  });
};

const createPurchase = (userId, sessionId, paymentIntentId, amount, planType, status) => {
  return new Promise((resolve, reject) => {
    const purchaseId = uuidv4();
    db.run(
      'INSERT INTO purchases (id, user_id, stripe_session_id, stripe_payment_intent_id, amount, plan_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [purchaseId, userId, sessionId, paymentIntentId, amount, planType, status],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            id: purchaseId,
            user_id: userId,
            amount,
            plan_type: planType,
            status
          });
        }
      }
    );
  });
};

const findAllUnverifiedUsers = () => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT email, email_verification_token, email_verification_expires_at FROM users WHERE email_verified = 0 AND email_verification_token IS NOT NULL ORDER BY created_at DESC LIMIT 10',
      [],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
};

module.exports = {
  initDatabase,
  createUser,
  findUserByEmail,
  findUserById,
  verifyPassword,
  updateUserEmailVerificationToken,
  verifyUserEmail,
  updateUserTrialStart,
  updateUserLifetimeAccess,
  updateUserStripeCustomerId,
  createPurchase,
  findAllUnverifiedUsers
};
