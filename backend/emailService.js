const Mailgun = require('mailgun.js');
const formData = require('form-data');

class EmailService {
    constructor() {
        this.setupMailgun();
    }

    setupMailgun() {
        try {
            if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
                console.log('⚠️  Mailgun not configured - emails will be logged only');
                this.mailgun = null;
                return;
            }

            const regionEnv = (process.env.MAILGUN_REGION || '').toUpperCase();

            // Determine API base URL based on region (default to US if not specified)
            const apiBaseUrl = regionEnv === 'EU' ?
                'https://api.eu.mailgun.net' :
                'https://api.mailgun.net';

            // Mailgun historically issued API keys that already contained the
            // "key-" prefix (e.g. key-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX) but
            // newer account-level and domain-level keys are provided *without*
            // that prefix and are much longer (typically 64 chars with two
            // hyphen-separated segments).
            //
            // To stay compatible with both formats we only auto-prepend the
            // prefix when the key looks like the **legacy** 32-character hex
            // token. Otherwise we assume the key is already in its correct
            // form and send it to Mailgun unmodified.
            let apiKey = (process.env.MAILGUN_API_KEY || '').trim();
            if (apiKey && !apiKey.startsWith('key-') && apiKey.length === 32) {
                apiKey = `key-${apiKey}`;
            }

            const mailgun = new Mailgun(formData);
            this.mailgun = mailgun.client({
                username: 'api',
                key: apiKey,
                url: apiBaseUrl
            });
            
            console.log(`✅ Mailgun email service initialized for ${regionEnv === 'EU' ? 'EU' : 'US'} region`);
        } catch (error) {
            console.error('❌ Mailgun setup error:', error);
            this.mailgun = null;
        }
    }

    async sendEmail(to, subject, htmlContent, textContent) {
        if (!this.mailgun) {
            console.log('📧 Email would be sent (Mailgun not configured):');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Text: ${textContent}`);
            return false;
        }

        try {
            const messageData = {
                from: `${process.env.FROM_NAME || 'Ascends'} <${process.env.FROM_EMAIL || `no-reply@${process.env.MAILGUN_DOMAIN}`}>`,
                to: to,
                subject: subject,
                text: textContent,
                html: htmlContent
            };

            const response = await this.mailgun.messages.create(process.env.MAILGUN_DOMAIN, messageData);
            console.log('✅ Email sent successfully:', response.id);
            await new Promise(resolve => setTimeout(resolve, 500)); // Give Mailgun time to settle
            return true;
        } catch (error) {
            console.error('❌ Email send error:', error);
            return false;
        }
    }

    async sendConfirmationEmail(email, confirmationToken) {
        const frontendUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
        const confirmationUrl = new URL('/verify-email', frontendUrl);
        confirmationUrl.searchParams.set('token', confirmationToken);
        
        const subject = 'Confirm Your Ascends Account';
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirm Your Account</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
                .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Welcome to Ascends!</h1>
                </div>
                <div class="content">
                    <h2>Confirm Your Email Address</h2>
                    <p>Thank you for signing up for Ascends! To get started with AI-powered posture monitoring, please confirm your email address by clicking the button below:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${confirmationUrl}" class="button">Confirm My Account</a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="background-color: #f3f4f6; padding: 15px; border-radius: 6px; word-break: break-all; font-family: monospace; font-size: 14px;">
                        ${confirmationUrl}
                    </p>
                    
                    <h3>What's Next?</h3>
                    <ul style="line-height: 1.6;">
                        <li>🎯 <strong>1-Hour Free Trial</strong> - Full access to all features</li>
                        <li>🤖 <strong>AI Face Touch Detection</strong> - Break bad habits</li>
                        <li>📐 <strong>Posture Monitoring</strong> - Real-time feedback</li>
                        <li>👑 <strong>Lifetime Access</strong> - Just $9.99, no subscriptions</li>
                    </ul>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        This link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2024 Ascends. All rights reserved.</p>
                    <p>Privacy-first • Processing happens locally in your browser</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const textContent = `
Welcome to Ascends!

Please confirm your email address by visiting this link:
${confirmationUrl}

What's included in your free trial:
- 1-hour full access to all features
- AI-powered face touch detection
- Real-time posture monitoring
- Lifetime access available for just $9.99

This link will expire in 24 hours.

If you didn't create an account, you can safely ignore this email.

© 2024 Ascends
        `;

        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    async sendWelcomeEmail(email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        const subject = '🎉 Welcome to Ascends - Your Account is Active!';
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Ascends</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
                .feature { background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #10b981; }
                .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Account Confirmed!</h1>
                </div>
                <div class="content">
                    <h2>Welcome to the Future of Posture Health!</h2>
                    <p>Your email has been successfully verified and your Ascends account is now active. You're ready to start your journey toward better posture and focused work habits!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}" class="button">Start Your Free Trial</a>
                    </div>
                    
                    <h3>🚀 What You Can Do Now:</h3>
                    
                    <div class="feature">
                        <h4>🎯 Start Your 1-Hour Free Trial</h4>
                        <p>Get full access to all premium features with no restrictions.</p>
                    </div>
                    
                    <div class="feature">
                        <h4>🤖 AI Face Touch Detection</h4>
                        <p>Break unconscious face-touching habits with real-time alerts.</p>
                    </div>
                    
                    <div class="feature">
                        <h4>📐 Posture Monitoring</h4>
                        <p>Get instant feedback when your posture needs adjustment.</p>
                    </div>
                    
                    <div class="feature">
                        <h4>🔧 Customize Your Experience</h4>
                        <p>Adjust sensitivity, sounds, and alerts to fit your workflow.</p>
                    </div>
                    
                    <h3>💡 Pro Tips for Success:</h3>
                    <ul style="line-height: 1.8;">
                        <li><strong>Start gradually</strong> - Use 10-15 minute sessions at first</li>
                        <li><strong>Calibrate properly</strong> - Take time to set your ideal posture</li>
                        <li><strong>Choose the right sounds</strong> - Pick alerts that work for your environment</li>
                        <li><strong>Be consistent</strong> - Daily use builds lasting habits</li>
                    </ul>
                    
                    <p>Ready to transform your work habits? Click the button above to get started!</p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Need help? Just reply to this email - we're here to support your posture journey.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2024 Ascends. All rights reserved.</p>
                    <p>Privacy-first • Processing happens locally in your browser</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const textContent = `
🎉 Welcome to Ascends!

Your email has been successfully verified and your account is now active!

What you can do now:
• Start your 1-hour free trial with full access
• Use AI-powered face touch detection
• Monitor your posture in real-time
• Customize alerts and sensitivity

Pro Tips:
- Start with 10-15 minute sessions
- Take time to calibrate your ideal posture
- Choose alerts that work for your environment
- Use daily for best results

Get started: ${frontendUrl}

Need help? Just reply to this email.

© 2024 Ascends
        `;

        return await this.sendEmail(email, subject, htmlContent, textContent);
    }

    async sendPremiumConfirmationEmail(email) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        const subject = '👑 Welcome to Ascends Premium - Lifetime Access Activated!';
        
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Premium Activated</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
                .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
                .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 20px; text-align: center; }
                .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 600; }
                .content { padding: 40px 30px; }
                .button { display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
                .premium-badge { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; display: inline-block; margin: 10px 0; }
                .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👑 Premium Activated!</h1>
                </div>
                <div class="content">
                    <div style="text-align: center;">
                        <div class="premium-badge">✨ LIFETIME ACCESS ✨</div>
                    </div>
                    
                    <h2>Thank You for Upgrading!</h2>
                    <p>Your payment has been processed successfully and you now have <strong>lifetime access</strong> to all Ascends premium features. No subscriptions, no recurring charges - you're set for life!</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${frontendUrl}" class="button">Access Your Premium Account</a>
                    </div>
                    
                    <h3>🎉 What's Included in Premium:</h3>
                    <ul style="line-height: 1.8;">
                        <li>🚫 <strong>Unlimited Usage</strong> - No time limits, ever</li>
                        <li>🤖 <strong>Advanced AI Detection</strong> - Most accurate face touch detection</li>
                        <li>📐 <strong>Professional Posture Analysis</strong> - Detailed monitoring</li>
                        <li>🔧 <strong>Full Customization</strong> - All settings and preferences</li>
                        <li>🔊 <strong>Custom Alert Sounds</strong> - Upload your own audio</li>
                        <li>📊 <strong>Detailed Analytics</strong> - Track your progress over time</li>
                        <li>💪 <strong>Habit Building Tools</strong> - Advanced coaching features</li>
                        <li>🎯 <strong>Priority Support</strong> - Direct access to our team</li>
                    </ul>
                    
                    <h3>🚀 Getting the Most from Premium:</h3>
                    <ul style="line-height: 1.8;">
                        <li><strong>Set daily goals</strong> - Track your posture improvement</li>
                        <li><strong>Use custom sounds</strong> - Make alerts work for your environment</li>
                        <li><strong>Review analytics</strong> - Understand your patterns</li>
                        <li><strong>Experiment with settings</strong> - Find your perfect configuration</li>
                    </ul>
                    
                    <p>You've made a great investment in your health and productivity. Here's to better posture and focused work ahead!</p>
                    
                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Questions about your premium features? Just reply to this email for priority support.
                    </p>
                </div>
                <div class="footer">
                    <p>© 2024 Ascends. All rights reserved.</p>
                    <p>Receipt and account details available in your dashboard</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const textContent = `
👑 Premium Activated - Lifetime Access!

Thank you for upgrading to Ascends Premium!

Your lifetime access includes:
• Unlimited usage - no time limits
• Advanced AI face touch detection
• Professional posture analysis
• Full customization options
• Custom alert sounds
• Detailed analytics
• Habit building tools
• Priority support

Access your premium account: ${frontendUrl}

Pro tips for premium users:
- Set daily posture goals
- Upload custom alert sounds
- Review your analytics regularly
- Experiment with advanced settings

Questions? Just reply for priority support.

© 2024 Ascends
        `;

        return await this.sendEmail(email, subject, htmlContent, textContent);
    }
}

module.exports = EmailService; 