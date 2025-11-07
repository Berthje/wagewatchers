/**
 * Test script for field normalizers
 * Tests the transformation of human-written Reddit values to standardized database values
 */

import {
  normalizeEducation,
  normalizeCivilStatus,
  normalizeContractType,
  normalizeCompanySize,
  normalizeWorkArrangement,
  normalizeWorkExperience,
  normalizeAge,
  normalizeBoolean,
  normalizeSector,
} from "../src/lib/field-normalizers";

console.log("🧪 Testing Field Normalizers\n");

// Test Education normalization
console.log("📚 EDUCATION NORMALIZATION:");
const educationTests = [
  "Prof Bachelor energy",
  "professional bachelor",
  "MA",
  "master",
  "phd",
  "high school",
  "graduaat",
  "ingenieur",
];

for (const test of educationTests) {
  const normalized = normalizeEducation(test);
  console.log(`  "${test}" → "${normalized}"`);
}

// Test Civil Status normalization
console.log("\n💑 CIVIL STATUS NORMALIZATION:");
const civilStatusTests = [
  "Unmarried",
  "single",
  "samenwonend",
  "married",
  "gescheiden",
  "living together",
];

for (const test of civilStatusTests) {
  const normalized = normalizeCivilStatus(test);
  console.log(`  "${test}" → "${normalized}"`);
}

// Test Work Experience normalization
console.log("\n💼 WORK EXPERIENCE NORMALIZATION:");
const workExpTests = [
  "2.5 Y",
  "5 years",
  "18 months",
  "10 jaar",
  "3.8 years",
  "24 months",
];

for (const test of workExpTests) {
  const normalized = normalizeWorkExperience(test);
  console.log(`  "${test}" → ${normalized} years`);
}

// Test Age normalization
console.log("\n👤 AGE NORMALIZATION:");
const ageTests = [
  "30y",
  "25 years old",
  "35",
  "42 jaar",
];

for (const test of ageTests) {
  const normalized = normalizeAge(test);
  console.log(`  "${test}" → ${normalized}`);
}

// Test Boolean normalization
console.log("\n✓ BOOLEAN NORMALIZATION:");
const booleanTests = [
  "Yes",
  "no",
  "ja",
  "nee",
  "N/A",
  "x",
];

for (const test of booleanTests) {
  const normalized = normalizeBoolean(test);
  console.log(`  "${test}" → ${normalized}`);
}

// Test Contract Type normalization
console.log("\n📝 CONTRACT TYPE NORMALIZATION:");
const contractTests = [
  "vast",
  "permanent",
  "cdi",
  "temporary",
  "freelance",
  "zelfstandig",
];

for (const test of contractTests) {
  const normalized = normalizeContractType(test);
  console.log(`  "${test}" → "${normalized}"`);
}

// Test Company Size normalization
console.log("\n🏢 COMPANY SIZE NORMALIZATION:");
const companySizeTests = [
  "startup",
  "small",
  "multinational",
  "< 10",
  "5000+",
];

for (const test of companySizeTests) {
  const normalized = normalizeCompanySize(test);
  console.log(`  "${test}" → "${normalized}"`);
}

// Test Work Arrangement normalization
console.log("\n🏠 WORK ARRANGEMENT NORMALIZATION:");
const workArrangementTests = [
  "wfh",
  "kantoor",
  "hybrid",
  "remote",
  "on-site",
];

for (const test of workArrangementTests) {
  const normalized = normalizeWorkArrangement(test);
  console.log(`  "${test}" → "${normalized}"`);
}

// Test Sector normalization
console.log("\n🏭 SECTOR NORMALIZATION:");
const sectorTests = [
  "IT",
  "tech",
  "banking",
  "gezondheidszorg",
  "consulting",
  "overheid",
];

for (const test of sectorTests) {
  const normalized = normalizeSector(test);
  console.log(`  "${test}" → "${normalized}"`);
}

console.log("\n✅ Normalization tests completed!");
