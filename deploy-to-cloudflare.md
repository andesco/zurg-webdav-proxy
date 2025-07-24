# Deploy to Cloudflare Workers

## One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/zurg-webdav-proxy)

## Manual Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/zurg-webdav-proxy.git
cd zurg-webdav-proxy
```

### 2. Install Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 3. Configure Your Zurg URL
Edit `wrangler.toml` and set your Zurg instance URL:

```toml
[vars]
ZURG_BASE_URL = "https://your-zurg-instance.com"
```

**Examples:**
- With basic auth: `"https://username:password@zurg.yourdomain.com"`
- Local instance: `"http://192.168.1.100:9999"`
- Tunnel: `"https://abc123.ngrok.io"`

### 4. Optional: Add Worker Authentication
Uncomment and set these variables in `wrangler.toml` for extra security:

```toml
WORKER_USERNAME = "your_username" 
WORKER_PASSWORD = "your_password"
```

### 5. Deploy
```bash
wrangler deploy
```

Your worker will be available at: `https://zurg-webdav-proxy.your-subdomain.workers.dev`

## Usage with Infuse

Replace your direct Zurg URLs with the worker URL:

- **WebDAV**: `https://your-worker.workers.dev/dav/`
- **Infuse**: `https://your-worker.workers.dev/infuse/`

If you enabled worker authentication, use those credentials in Infuse.