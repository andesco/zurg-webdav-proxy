# 🔧 Zurg RFC1123 WebDAV Proxy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/zurg-rfc1123-proxy)

A Cloudflare Worker that acts as a proxy between Zurg's WebDAV endpoints and Infuse, automatically converting ISO 8601 timestamps to RFC1123 format for proper WebDAV compliance.

**🎯 Fixes Infuse's "most recent files" detection with Zurg!**

## 🎯 Problem Solved

Infuse has trouble determining "most recent files" from Zurg because Zurg returns timestamps in ISO 8601 format instead of the RFC1123 format required by WebDAV standards.

**Before (Zurg):**
```xml
<d:getlastmodified>2025-07-02T19:32:30.000+01:00</d:getlastmodified>
```

**After (This Proxy):**
```xml
<d:getlastmodified>Wed, 02 Jul 2025 17:32:30 GMT</d:getlastmodified>
```

## 🚀 Quick Setup

### 1. One-Click Deploy

Click the deploy button above or manually configure:

### 2. Configure Zurg Base URL

Edit `wrangler.toml` and set your Zurg URL:

```toml
[vars]
ZURG_BASE_URL = "https://your-zurg-instance.com"
```

**Examples:**
- With credentials: `"https://username:password@zurg.yourdomain.com"`
- Local network: `"http://192.168.1.100:9999"`
- Tunnel service: `"https://abc123.ngrok.io"`

### 3. Deploy to Cloudflare

```bash
wrangler deploy
```

### 4. Use with Infuse

Point Infuse to your Cloudflare Worker URL:

```
https://your-worker-name.your-subdomain.workers.dev/infuse/
```

## 🔧 Configuration

### Basic Zurg URL Configuration

Set your Zurg URL in `wrangler.toml`:

```toml
[vars]
# Examples:
ZURG_BASE_URL = "https://username:password@zurg.yourdomain.com"    # With basic auth
ZURG_BASE_URL = "https://zurg.yourdomain.com:9999"                # Custom domain
ZURG_BASE_URL = "http://192.168.1.100:9999"                       # Local IP
ZURG_BASE_URL = "https://abc123.ngrok.io"                         # Tunnel
```

### Optional: Worker-Level Authentication

Add an extra layer of security by uncommenting in `wrangler.toml`:

```toml
[vars]
WORKER_USERNAME = "your_username"
WORKER_PASSWORD = "your_password"
```

## 📊 Features

- ✅ **Transparent Proxy**: All non-WebDAV requests pass through unchanged
- ✅ **Smart Timestamp Conversion**: Only converts WebDAV PROPFIND responses
- ✅ **Multiple Format Support**: Handles various ISO 8601 variants
- ✅ **Error Resilient**: Falls back gracefully if conversion fails
- ✅ **Optional Auth**: Add worker-level basic authentication
- ✅ **Fast & Global**: Cloudflare's edge network for low latency

## 🔍 How It Works

1. **Request Forwarding**: Proxies all requests to your Zurg instance
2. **WebDAV Detection**: Identifies PROPFIND responses with XML content
3. **Timestamp Fixing**: Converts `<d:getlastmodified>` timestamps to RFC1123
4. **Response Return**: Returns the fixed XML to Infuse

## 🧪 Testing

### Test WebDAV Response Format

```bash
# Test the proxy
curl -X PROPFIND -H "Depth: 1" https://your-worker.your-subdomain.workers.dev/infuse/movies/

# Should return timestamps like:
# <d:getlastmodified>Wed, 02 Jul 2025 17:32:30 GMT</d:getlastmodified>
```

### Compare Before/After

```bash
# Direct Zurg (broken format)
curl -X PROPFIND -H "Depth: 1" https://your-zurg-instance.com/infuse/movies/ | grep getlastmodified

# Through proxy (fixed format)  
curl -X PROPFIND -H "Depth: 1" https://your-worker.your-subdomain.workers.dev/infuse/movies/ | grep getlastmodified
```

## 🌐 Deployment Options

### Option 1: Default Cloudflare Domain
```
https://zurg-rfc1123-proxy.your-subdomain.workers.dev
```

### Option 2: Custom Domain
Configure a custom domain in Cloudflare Dashboard:
```
https://zurg-proxy.yourdomain.com
```

### Option 3: Route Pattern
Set up a route pattern for existing domain:
```
https://yourdomain.com/zurg/*
```

## 🔗 Infuse Configuration

Use these URLs in Infuse:

- **WebDAV**: `https://your-worker-url/dav/`
- **Infuse**: `https://your-worker-url/infuse/`

## 📈 Performance

- **Cold Start**: ~10-50ms additional latency
- **Warm Requests**: ~1-5ms additional latency  
- **Caching**: Cloudflare's global edge network
- **Bandwidth**: No additional costs for most usage

## 🐛 Troubleshooting

### Check Worker Logs
```bash
wrangler tail
```

### Verify Environment Variable
```bash
wrangler secret list
```

### Test Timestamp Conversion
The worker logs conversion attempts, check for warnings about failed conversions.

## 🔄 Updates

To update the worker:
```bash
npm run deploy
```

Changes are deployed instantly to Cloudflare's global network.

---

**Result**: Infuse will now properly detect and sort files by recency! 🎯