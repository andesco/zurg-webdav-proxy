/**
 * Test script to verify timestamp conversion logic
 * Run with: node test-timestamps.js
 */

// Copy the conversion function from the worker
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

// Test cases from our analysis
const testCases = [
	'2025-07-02T19:32:30.000+01:00',  // ISO 8601 with timezone
	'2025-06-06T21:38:37.000+01:00',  // Another ISO 8601 example
	'2025-07-02T19:32:30Z',           // RFC3339 UTC
	'',                               // Empty string
	'Wed, 02 Jul 2025 17:32:30 GMT',  // Already RFC1123
	'2025-07-02T19:32:30.000Z',       // ISO 8601 with milliseconds
];

console.log('🧪 Testing timestamp conversion to RFC1123:');
console.log('='.repeat(60));

testCases.forEach((input, index) => {
	const result = convertToRFC1123(input);
	console.log(`${index + 1}. Input:  '${input}'`);
	console.log(`   Output: '${result}'`);
	console.log();
});

// Test XML replacement
const sampleXML = `<?xml version="1.0" encoding="utf-8"?><d:multistatus xmlns:d="DAV:">
<d:response>
	<d:href>Example.Movie.2025</d:href>
	<d:propstat>
		<d:prop>
			<d:getlastmodified>2025-07-02T19:32:30.000+01:00</d:getlastmodified>
		</d:prop>
	</d:propstat>
</d:response>
<d:response>
	<d:href>Empty.timestamp</d:href>
	<d:propstat>
		<d:prop>
			<d:getlastmodified></d:getlastmodified>
		</d:prop>
	</d:propstat>
</d:response>
</d:multistatus>`;

function fixWebDAVTimestamps(xmlText) {
	const timestampRegex = /<d:getlastmodified>([^<]*)<\/d:getlastmodified>/g;
	
	return xmlText.replace(timestampRegex, (match, timestamp) => {
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
	});
}

console.log('🔧 Testing XML timestamp replacement:');
console.log('='.repeat(60));
console.log('BEFORE:');
console.log(sampleXML);
console.log('\nAFTER:');
console.log(fixWebDAVTimestamps(sampleXML));