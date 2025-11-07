/**
 * Test commute distance parsing
 */

// Simplified version of the function for testing
function parseCommuteDistance(value: string): string | null {
  if (!value) return null;

  const lowerValue = value.toLowerCase().trim();

  // Distance keywords in multiple languages
  const distanceKeywords = [
    'km',
    'kilometer',
    'kilometers',
    'kilometre',
    'kilometres',
    'miles',
    'mile',
  ];

  // Time keywords to ignore
  const timeKeywords = [
    'min',
    'mins',
    'minute',
    'minutes',
    'hour',
    'hours',
    'h',
  ];

  // Check if value contains distance keywords
  const hasDistanceKeyword = distanceKeywords.some(keyword => lowerValue.includes(keyword));

  if (hasDistanceKeyword) {
    // Extract number(s) before distance keyword
    const distancePattern = /(\d+(?:-\d+)?(?:\.\d+)?)\s*(?:km|kilometer|kilometers|kilometre|kilometres|miles|mile)/i;
    const match = distancePattern.exec(value);

    if (match) {
      return match[1];
    }
  }

  // If no distance keyword but has time keyword, try to extract distance part
  const hasTimeKeyword = timeKeywords.some(keyword => lowerValue.includes(keyword));

  if (hasTimeKeyword) {
    // Try to find a number that's NOT followed by time keywords
    const beforeTimePattern = /(\d+(?:-\d+)?(?:\.\d+)?)\s*(?:km|kilometer|kilometers|kilometre|kilometres)?(?=.*(?:min|minute|hour|h))/i;
    const match = beforeTimePattern.exec(value);

    if (match) {
      return match[1];
    }
  }

  // If no keywords found, check if it's just a number or range
  const simpleNumberPattern = /^(\d+(?:-\d+)?(?:\.\d+)?)$/;
  const match = simpleNumberPattern.exec(lowerValue);

  if (match) {
    return match[1];
  }

  // Last resort: extract first number found
  const anyNumberPattern = /(\d+(?:-\d+)?(?:\.\d+)?)/;
  const anyMatch = anyNumberPattern.exec(value);

  return anyMatch ? anyMatch[1] : null;
}

console.log("\n🧪 Testing Commute Distance Parsing\n");
console.log("=".repeat(80));

const testCases = [
  "18km 25min",
  "18km 25mins",
  "25 kilometers",
  "30 km, 45 minutes",
  "15",
  "20-30 km",
  "5 miles 10 minutes",
  "12km",
  "45 minutes 8km",
  "50",
  "10.5 km",
  "15-20",
  "20 kilometre",
  "25 kilometres 30 mins",
  "1 hour 35km",
];

for (const testCase of testCases) {
  const result = parseCommuteDistance(testCase);
  console.log(`  "${testCase}" → "${result}"`);
}

console.log("\n" + "=".repeat(80));
console.log("✅ Test complete!\n");

process.exit(0);
