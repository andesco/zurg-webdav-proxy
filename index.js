/**
 * Cloudflare Worker to proxy Zurg WebDAV requests and fix RFC1123 timestamp format
 * Fixes Infuse compatibility by converting ISO 8601 timestamps to RFC1123
 */

export default {
	async fetch(request, env, ctx) {
		try {
			// Get the Zurg base URL from environment variable
			const zurgBaseUrl = env.ZURG_BASE_URL;
			if (!zurgBaseUrl) {
				return new Response('ZURG_BASE_URL environment variable not set', { status: 500 });
			}

			// Optional: Worker-level basic auth
			if (env.WORKER_USERNAME && env.WORKER_PASSWORD) {
				const authHeader = request.headers.get('Authorization');
				if (!authHeader || !isValidAuth(authHeader, env.WORKER_USERNAME, env.WORKER_PASSWORD)) {
					return new Response('Unauthorized', {
						status: 401,
						headers: { 'WWW-Authenticate': 'Basic realm="Zurg RFC1123 Proxy"' }
					});
				}
			}

			// Parse the incoming request URL
			const url = new URL(request.url);
			const targetUrl = new URL(zurgBaseUrl);
			
			// Construct the target URL with the same path and query parameters
			targetUrl.pathname = url.pathname;
			targetUrl.search = url.search;

			// Create headers for the proxied request
			const headers = new Headers(request.headers);
			headers.set('Host', targetUrl.host);
			
			// Forward the request to Zurg
			const response = await fetch(targetUrl.toString(), {
				method: request.method,
				headers: headers,
				body: request.body,
			});

			// Check if this is a WebDAV PROPFIND response that needs timestamp fixing
			const contentType = response.headers.get('content-type') || '';
			const isWebDAVResponse = request.method === 'PROPFIND' && 
									 contentType.includes('xml') &&
									 response.status === 207; // Multi-Status

			if (isWebDAVResponse) {
				// Read and fix the XML response
				const xmlText = await response.text();
				const fixedXml = fixWebDAVTimestamps(xmlText);
				
				// Return the fixed response
				return new Response(fixedXml, {
					status: response.status,
					statusText: response.statusText,
					headers: response.headers
				});
			}

			// For non-WebDAV responses, just proxy as-is
			return response;

		} catch (error) {
			console.error('Proxy error:', error);
			return new Response(`Proxy error: ${error.message}`, { status: 500 });
		}
	}
};

/**
 * Fix WebDAV timestamps by converting ISO 8601 to RFC1123 format
 * @param {string} xmlText - The XML response from Zurg
 * @returns {string} - Fixed XML with RFC1123 timestamps
 */
function fixWebDAVTimestamps(xmlText) {
	// Regex to find getlastmodified elements with ISO 8601 timestamps
	const timestampRegex = /<d:getlastmodified>([^<]*)<\/d:getlastmodified>/g;
	
	return xmlText.replace(timestampRegex, (match, timestamp) => {
		// Skip empty timestamps
		if (!timestamp.trim()) {
			return match;
		}
		
		try {
			// Convert ISO 8601 to RFC1123
			const rfc1123Timestamp = convertToRFC1123(timestamp.trim());
			return `<d:getlastmodified>${rfc1123Timestamp}</d:getlastmodified>`;
		} catch (error) {
			console.warn('Failed to convert timestamp:', timestamp, error);
			// Return original if conversion fails
			return match;
		}
	});
}

/**
 * Convert various timestamp formats to RFC1123 for WebDAV compliance
 * @param {string} timestamp - Input timestamp string
 * @returns {string} - RFC1123 formatted timestamp
 */
function convertToRFC1123(timestamp) {
	if (!timestamp) {
		return '';
	}
	
	// Try parsing common formats used in Zurg
	const formats = [
		// Standard JavaScript Date parsing (handles RFC3339, ISO 8601, etc.)
		timestamp,
		// Handle Real-Debrid's specific format with milliseconds
		timestamp.replace(/\.(\d{3})Z$/, 'Z'), // Remove milliseconds
		// Already RFC1123 format
		timestamp
	];
	
	for (const format of formats) {
		try {
			const date = new Date(format);
			if (!isNaN(date.getTime())) {
				// Convert to RFC1123 format (toUTCString returns RFC1123)
				return date.toUTCString();
			}
		} catch (error) {
			// Continue to next format
		}
	}
	
	// If all parsing fails, return empty to avoid invalid WebDAV
	return '';
}

/**
 * Validate basic authentication credentials
 * @param {string} authHeader - Authorization header value
 * @param {string} username - Expected username
 * @param {string} password - Expected password
 * @returns {boolean} - Whether credentials are valid
 */
function isValidAuth(authHeader, username, password) {
	if (!authHeader.startsWith('Basic ')) {
		return false;
	}
	
	try {
		const encoded = authHeader.slice(6);
		const decoded = atob(encoded);
		const [user, pass] = decoded.split(':');
		return user === username && pass === password;
	} catch (error) {
		return false;
	}
}