# Mailgun Email Setup Guide

## Overview
This guide will help you set up Mailgun for sending real emails in your Ascends application.

## Why Mailgun?
- **Reliable delivery**: Industry-leading email deliverability
- **Free tier**: 5,000 emails/month for 3 months, then 1,000/month
- **Easy setup**: Simple API integration
- **Good reputation**: Less likely to be marked as spam compared to Gmail SMTP

## Step-by-Step Setup

### 1. Create a Mailgun Account
1. Go to [https://app.mailgun.com/](https://app.mailgun.com/)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Credentials
1. Once logged in, go to **Settings** → **API Keys**
2. Copy your **Private API Key** (starts with `key-`)
3. Note your **Domain** (you can use the sandbox domain for testing)

### 3. Domain Setup (Optional but Recommended)
For production, set up your own domain:
1. Go to **Sending** → **Domains**
2. Click **Add New Domain**
3. Enter your domain (e.g., `mail.yourdomain.com`)
4. Follow the DNS configuration instructions

### 4. Configure Your Environment
Update your `.env` file with the following:

```bash
# Mailgun Configuration
MAILGUN_API_KEY=key-your-private-api-key-here
MAILGUN_DOMAIN=sandbox-your-domain.mailgun.org
FROM_NAME=Ascends
FROM_EMAIL=no-reply@yourdomain.com

# Optional: Custom frontend URL
FRONTEND_URL=https://yourdomain.com
```

### 5. Test Your Setup
1. Restart your backend server
2. Register a new user with a real email address
3. Check your email for the confirmation message

## Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MAILGUN_API_KEY` | Yes | Your private API key from Mailgun | `key-1234567890abcdef...` |
| `MAILGUN_DOMAIN` | Yes | Your sending domain | `sandbox-abc123.mailgun.org` |
| `FROM_NAME` | No | Display name for emails | `Ascends` |
| `FROM_EMAIL` | No | From email address | `no-reply@yourdomain.com` |
| `FRONTEND_URL` | No | Your frontend URL for links | `https://yourdomain.com` |

## Testing Configuration

### Development/Testing
For development, you can use the sandbox domain:
- **Domain**: `sandbox-xxxxxxxx.mailgun.org` (from your Mailgun dashboard)
- **Limitation**: Can only send to authorized recipients (add test emails in Mailgun)

### Production
For production, use your own domain:
- **Domain**: `mail.yourdomain.com` (requires DNS setup)
- **Benefit**: Can send to any email address

## Email Templates

The system includes three email templates:

1. **Confirmation Email**: Sent after registration
2. **Welcome Email**: Sent after email verification
3. **Premium Email**: Sent after successful payment

All templates are responsive and professionally designed.

## Troubleshooting

### Common Issues

1. **Invalid API Key**
   - Check that you copied the private API key correctly
   - Ensure no extra spaces or characters

2. **Domain Not Found**
   - Verify the domain name matches exactly what's in your Mailgun dashboard
   - For sandbox domains, include the full sandbox URL

3. **Authentication Failed**
   - Double-check your API key
   - Ensure you're using the private key, not the public key

4. **Emails Not Sending**
   - Check the server logs for detailed error messages
   - Verify your domain's DNS settings (for custom domains)

### Test Commands

Test your Mailgun setup with these commands:

```bash
# Test registration (replace with real email)
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com","password":"password123","confirmPassword":"password123"}'

# Check server logs for email sending status
# Look for "✅ Email sent successfully" or error messages
```

## Production Considerations

### Domain Setup
1. **Add DNS Records**: Configure SPF, DKIM, and DMARC records
2. **Verify Domain**: Complete domain verification in Mailgun
3. **Test Deliverability**: Send test emails to various providers (Gmail, Yahoo, etc.)

### Security
1. **Keep API Keys Secret**: Never commit API keys to version control
2. **Use Environment Variables**: Always use `.env` files
3. **Rotate Keys**: Regularly rotate API keys

### Monitoring
1. **Check Delivery Stats**: Monitor email delivery rates in Mailgun dashboard
2. **Handle Bounces**: Implement bounce handling for better deliverability
3. **Track Opens/Clicks**: Use Mailgun's tracking features (optional)

## Cost Considerations

### Free Tier
- **First 3 months**: 5,000 emails/month
- **After 3 months**: 1,000 emails/month
- **Perfect for**: Development and small applications

### Paid Plans
- **Foundation**: $35/month for 50,000 emails
- **Growth**: $80/month for 100,000 emails
- **Scale**: Custom pricing for higher volumes

## Alternative Providers

If you prefer other email services:
- **SendGrid**: Similar API, good alternative
- **Amazon SES**: Lower cost, requires AWS setup
- **Postmark**: Excellent for transactional emails

## Support

For Mailgun-specific issues:
- **Documentation**: [https://documentation.mailgun.com/](https://documentation.mailgun.com/)
- **Support**: Available through Mailgun dashboard
- **Community**: Stack Overflow with `mailgun` tag

## Next Steps

1. ✅ Complete Mailgun setup
2. ✅ Test with real email addresses
3. ✅ Configure custom domain (recommended for production)
4. ✅ Set up monitoring and alerts
5. ✅ Implement bounce handling (optional)

---

**Note**: Without Mailgun configuration, the system will log emails to the console instead of sending them. This is perfect for development but not suitable for production.

## Example Working Configuration

```bash
# .env file example
MAILGUN_API_KEY=key-1234567890abcdef1234567890abcdef
MAILGUN_DOMAIN=sandbox-abc123def456.mailgun.org
FROM_NAME=Ascends
FROM_EMAIL=no-reply@ascends.me
FRONTEND_URL=http://localhost:3000
```

With this setup, your email verification system will work perfectly! 