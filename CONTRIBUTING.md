# Contributing to Zurg RFC1123 Proxy

## 🛠️ Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/zurg-webdav-proxy.git
   cd zurg-webdav-proxy
   ```

2. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   wrangler login
   ```

3. **Configure for testing**
   ```bash
   cp wrangler.toml wrangler.dev.toml
   # Edit wrangler.dev.toml with your test Zurg instance
   ```

4. **Test locally**
   ```bash
   wrangler dev --config wrangler.dev.toml
   ```

## 🧪 Testing

### Unit Tests
```bash
node test-timestamps.js
```

### Manual Testing
```bash
# Test timestamp conversion
curl -X PROPFIND -H "Depth: 1" http://localhost:8787/infuse/

# Should return RFC1123 timestamps like:
# <d:getlastmodified>Wed, 02 Jul 2025 17:32:30 GMT</d:getlastmodified>
```

## 📝 Pull Request Guidelines

1. **Test your changes** with a real Zurg instance
2. **Update documentation** if adding new features
3. **Keep commits atomic** and well-described
4. **Ensure no sensitive data** is committed

## 🔒 Security

- Never commit API tokens, passwords, or URLs with credentials
- Use environment variables for all sensitive configuration
- Test with dummy data when possible

## 🐛 Bug Reports

Please include:
1. Zurg version and configuration
2. Infuse version
3. Error logs from Cloudflare Workers
4. Sample WebDAV request/response if possible

## 💡 Feature Requests

Before implementing new features, please open an issue to discuss:
1. Use case and problem being solved
2. Proposed solution approach
3. Compatibility considerations

## 🚀 Deployment

Maintainers can deploy using:
```bash
wrangler deploy
```

GitHub Actions automatically deploys on push to main branch.