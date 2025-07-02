# 🔧 Zurg RFC1123 WebDAV Proxy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-rfc1123-proxy)

A Cloudflare Worker that acts as a proxy to Zurg’s WebDAV endpoints, automatically converting various ISO 8601 timestamps to RFC1123 format for proper WebDAV compliance.

Infuse has trouble determining the most recent media files because Zurg returns timestamps in ISO 8601 format instead of the RFC1123 format required by WebDAV standards.

**Zurg:** (zurg:2025.07.02.0032-nightly)
```xml
<d:getlastmodified>2025-07-02T19:32:30.000+01:00</d:getlastmodified>
```

**This Proxy:**
```xml
<d:getlastmodified>Wed, 02 Jul 2025 17:32:30 GMT</d:getlastmodified>
```

## Quick Setup

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-rfc1123-proxy)

1. [Deploy to Cloudflare](https://deploy.workers.cloudflare.com/?url=https://github.com/andesco/zurg-rfc1123-proxy)
2. select: Create and deploy, Continue to project…
3. Settings › Variables and Secrets…
 
`ZURG_BASE_URL`

- with credentials: `https://username:password@zurg.yourhost.com`
- local network: `http://192.168.1.100:9999`

`WORKER_USERNAME` & `WORKER_PASSWORD`

- [basic authentication](https://en.wikipedia.org/wiki/Basic_access_authentication)

### 4. Update WebDAV Clients

- `https://your-worker-name.your-subdomain.workers.dev/dav/`
- `https://your-worker-name.your-subdomain.workers.dev/infuse/`

