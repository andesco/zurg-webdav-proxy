/**
 * Cloudflare Worker to proxy Zurg WebDAV requests and fix RFC1123 timestamp format
 * Fixes Infuse compatibility by converting ISO 8601 timestamps to RFC1123
 */

export default {
	async fetch(request, env, ctx) {
		const config = await getConfig(env.ZURG_PROXY_CONFIG);

		// Helper functions for KV
		async function getConfig(kv) {
			const storedConfig = await kv.get('config', 'json');
			return storedConfig || { fixTimestamps: false, rewriteRules: [], locationRewriteRules: [] };
		}

		async function saveConfig(kv, newConfig) {
			await kv.put('config', JSON.stringify(newConfig));
		}

		/**
		 * Rewrites a URL based on a set of rules.
		 * @param {string} urlString - The URL string to rewrite.
		 * @param {Array<Object>} rewriteRules - An array of rewrite rules.
		 * @returns {string} - Rewritten URL.
		 */
		function rewriteUrl(urlString, rewriteRules) {
			let rewrittenUrl = urlString;
			for (const rule of rewriteRules) {
				if (rule.type === 'exact') {
					const regex = new RegExp(rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\if (rule.type === 'exact') {
					const regex = new RegExp(rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\async function getConfig(kv) {
			const storedConfig = await kv.get('config', 'json');
			return storedConfig || { fixTimestamps: false, rewriteRules: [] };
		}

		async function saveConfig(kv, newConfig) {
			await kv.put('config', JSON.stringify(newConfig));
		}'), 'gi');'), 'gi');
					rewrittenUrl = rewrittenUrl.replace(regex, rule.replace);
				} else if (rule.type === 'regex') {
					const regex = new RegExp(rule.find, 'g');
					rewrittenUrl = rewrittenUrl.replace(regex, rule.replace);
				}
			}
			return rewrittenUrl;
		}

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
			console.log(`Incoming request path: ${url.pathname}`);

			// Handle /config route
			if (url.pathname === '/config' || url.pathname === '/config/') {
				console.log('Handling /config route.');
				if (request.method === 'POST') {
					const formData = await request.formData();
					const fixTimestamps = formData.get('fixTimestamps') === 'on';
					const rewriteRules = [];
					const findValues = formData.getAll('filenameFindValue');
					const replaceValues = formData.getAll('filenameReplaceValue');
					const ruleTypes = formData.getAll('filenameRuleType');

					for (let i = 0; i < findValues.length; i++) {
						rewriteRules.push({
							type: ruleTypes[i],
							find: findValues[i],
							replace: replaceValues[i],
						});
					}

					const locationRewriteRules = [];
					const locationFindValues = formData.getAll('locationFindValue');
					const locationReplaceValues = formData.getAll('locationReplaceValue');
					const locationRuleTypes = formData.getAll('locationRuleType');

					for (let i = 0; i < locationFindValues.length; i++) {
						locationRewriteRules.push({
							type: locationRuleTypes[i],
							find: locationFindValues[i],
							replace: locationReplaceValues[i],
						});
					}

					const newConfig = { fixTimestamps, rewriteRules, locationRewriteRules };
					await saveConfig(env.ZURG_PROXY_CONFIG, newConfig);
					return new Response('Configuration saved!', { status: 200 });
				} else {
					// Serve the configuration page
					const currentConfig = await getConfig(env.ZURG_PROXY_CONFIG);
					const fixTimestampsChecked = currentConfig.fixTimestamps ? 'checked' : '';
					const rewriteRulesHtml = currentConfig.rewriteRules.map(rule => `
                        <hr>
                        <label>Type: 
                            <select class="ruleType">
                                <option value="exact" ${rule.type === 'exact' ? 'selected' : ''}>Exact</option>
                                <option value="regex" ${rule.type === 'regex' ? 'selected' : ''}>Regex</option>
                            </select>
                        </label>
                        <label>Find: <input type="text" class="findValue" value="${rule.find}"></label>
                        <label>Replace: <input type="text" class="replaceValue" value="${rule.replace}"></label>
                        <button type="button" class="removeRule">Remove</button>
                    `).join('');

					return new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zurg WebDAV Proxy Config</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        form { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px; }
        label { display: block; margin-bottom: 8px; }
        input[type="checkbox"] { margin-right: 10px; }
        button { padding: 10px 15px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
        button:hover { background-color: #0056b3; }
    </style>
</head>
<body>
    <form method="POST">
        <h1>Zurg WebDAV Proxy Configuration</h1>
        <label>
            <input type="checkbox" id="fixTimestamps" name="fixTimestamps" ${fixTimestampsChecked}> Enable RFC1123 Timestamp Fix
        </label>
        <h2>Filename Rewrites</h2>
        <div id="filenameRewriteRules">
            ${rewriteRulesHtml}
        </div>
        <button type="button" id="addFilenameRule">Add Rule</button>

        <h2>Location Rewrites</h2>
        <div id="locationRewriteRules">
            ${locationRewriteRulesHtml}
        </div>
        <button type="button" id="addLocationRule">Add Rule</button>

        <button type="submit">Save Configuration</button>
        <script id="currentConfig" type="application/json">${JSON.stringify(currentConfig)}</script>
    </form>
    <script>
        // Function to add a new rule row
        function addRuleRow(containerId, ruleType = 'exact', findValue = '', replaceValue = '', typeName = 'ruleType', findName = 'findValue', replaceName = 'replaceValue') {
            const rulesDiv = document.getElementById(containerId);
            const newRuleDiv = document.createElement('div');
            newRuleDiv.innerHTML = `
                <hr>
                <label>Type: 
                    <select class="ruleType" name="${typeName}">
                        <option value="exact" ${ruleType === 'exact' ? 'selected' : ''}>Exact</option>
                        <option value="regex" ${ruleType === 'regex' ? 'selected' : ''}>Regex</option>
                    </select>
                </label>
                <label>Find: <input type="text" class="findValue" name="${findName}" value="${findValue}"></label>
                <label>Replace: <input type="text" class="replaceValue" name="${replaceName}" value="${replaceValue}"></label>
                <button type="button" class="removeRule">Remove</button>
            `;
            rulesDiv.appendChild(newRuleDiv);

            newRuleDiv.querySelector('.removeRule').addEventListener('click', (e) => {
                e.target.closest('div').remove();
            });
        }

        // Add event listeners for adding rules
        document.getElementById('addFilenameRule').addEventListener('click', () => {
            addRuleRow('filenameRewriteRules', 'exact', '', '', 'filenameRuleType', 'filenameFindValue', 'filenameReplaceValue');
        });
        document.getElementById('addLocationRule').addEventListener('click', () => {
            addRuleRow('locationRewriteRules', 'exact', '', '', 'locationRuleType', 'locationFindValue', 'locationReplaceValue');
        });

        // Populate existing rules on load
        const currentConfig = JSON.parse(document.getElementById('currentConfig').textContent);
        if (currentConfig.rewriteRules) {
            currentConfig.rewriteRules.forEach(rule => {
                addRuleRow('filenameRewriteRules', rule.type, rule.find, rule.replace, 'filenameRuleType', 'filenameFindValue', 'filenameReplaceValue');
            });
        }
        if (currentConfig.locationRewriteRules) {
            currentConfig.locationRewriteRules.forEach(rule => {
                addRuleRow('locationRewriteRules', rule.type, rule.find, rule.replace, 'locationRuleType', 'locationFindValue', 'locationReplaceValue');
            });
        }

        // Add event listeners for existing remove buttons (for dynamically added rules)
        document.querySelectorAll('.removeRule').forEach(button => {
            button.addEventListener('click', (e) => {
                e.target.closest('div').remove();
            });
        });
    </script>
</body>
</html>`, {
						headers: { 'Content-Type': 'text/html' }
					});
				}
			}

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
				const rewriteRules = [];

				if (config.fixTimestamps) {
					rewriteRules.push({
						type: 'regex',
						find: '<d:getlastmodified>([^<]*)<\/d:getlastmodified>',
						replace: (match, timestamp) => {
							if (!timestamp.trim()) {
								return match;
							}
							try {
								const rfc1123Timestamp = convertToRFC1123(timestamp.trim());
								return `<d:getlastmodified>${rfc1123Timestamp}</d:getlastmodified>`;
							} catch (error) {
								console.warn('Failed to convert timestamp:', timestamp, error);
								return match;
							}
						}
					});
				}

				// Add filename rewrite rules from config
				config.rewriteRules.forEach(rule => {
					rewriteRules.push({
						type: rule.type,
						find: rule.find,
						replace: rule.replace
					});
				});

				let fixedXml = xmlText;
				if (rewriteRules.length > 0) {
					fixedXml = rewriteWebDAVXml(xmlText, rewriteRules);
				}
				
				// Return the fixed response
				return new Response(fixedXml, {
					status: response.status,
					statusText: response.statusText,
					headers: response.headers
				});
			}

			// For non-WebDAV responses, just proxy as-is
			let finalResponse = response;
			const locationHeader = response.headers.get('Location');
			if (locationHeader && config.locationRewriteRules.length > 0) {
				const rewrittenLocation = rewriteUrl(locationHeader, config.locationRewriteRules);
				if (rewrittenLocation !== locationHeader) {
					const newHeaders = new Headers(response.headers);
					newHeaders.set('Location', rewrittenLocation);
					finalResponse = new Response(response.body, {
						status: response.status,
						statusText: response.statusText,
						headers: newHeaders
					});
				}
			}
			return finalResponse;

		} catch (error) {
			console.error('Proxy error:', error);
			return new Response(`Proxy error: ${error.message}`, { status: 500 });
		}
	}
};

/**
 * Rewrites WebDAV XML responses based on a set of rules.
 * @param {string} xmlText - The XML response from Zurg
 * @param {Array<Object>} rewriteRules - An array of rewrite rules.
 * @returns {string} - Rewritten XML.
 */
function rewriteWebDAVXml(xmlText, rewriteRules) {
    let rewrittenXml = xmlText;

    for (const rule of rewriteRules) {
        if (rule.type === 'exact') {
            // Case-insensitive exact match
            const regex = new RegExp(rule.find.replace(/[.*+?^${}()|[\\]/g, '\if (rule.type === 'exact') {
            // Case-insensitive exact match
            const regex = new RegExp(rule.find.replace(/[.*+?^${}()|[\]\\]/g, '\\/**
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
}'), 'gi');'), 'gi');

            rewrittenXml = rewrittenXml.replace(regex, rule.replace);
        } else if (rule.type === 'regex') {
            // Regex match
            const regex = new RegExp(rule.find, 'g');
            rewrittenXml = rewrittenXml.replace(regex, rule.replace);
        }
    }
    return rewrittenXml;
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