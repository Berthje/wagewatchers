import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { salaryEntries, cities } from "@/lib/db/schema";
import { eq, sql, and, isNotNull } from "drizzle-orm";
import { getProvinceName, getISO3166Code } from "@/lib/utils/admin-divisions";
import { mean, median, min, max } from "d3-array";
import { COUNTRY_CODE_MAP } from "@/lib/constants";
import type {
  MapDataParams,
  CountryMapData,
  ProvinceMapData,
  CityLookup,
  SalaryStats,
} from "@/types";

function calculateSalaryStats(salaries: number[]): SalaryStats {
  return {
    count: salaries.length,
    avgSalary: Math.round(mean(salaries) ?? 0),
    medianSalary: Math.round(median(salaries) ?? 0),
    minSalary: Math.round(min(salaries) ?? 0),
    maxSalary: Math.round(max(salaries) ?? 0),
  };
}

function parseSearchParams(searchParams: URLSearchParams) {
  return {
    country: searchParams.get("country") || undefined,
    sector: searchParams.get("sector") || undefined,
    minExperience: searchParams.get("minExperience")
      ? Number(searchParams.get("minExperience"))
      : undefined,
    maxExperience: searchParams.get("maxExperience")
      ? Number(searchParams.get("maxExperience"))
      : undefined,
    minAge: searchParams.get("minAge") ? Number(searchParams.get("minAge")) : undefined,
    maxAge: searchParams.get("maxAge") ? Number(searchParams.get("maxAge")) : undefined,
    minGrossSalary: searchParams.get("minGrossSalary")
      ? Number(searchParams.get("minGrossSalary"))
      : undefined,
    maxGrossSalary: searchParams.get("maxGrossSalary")
      ? Number(searchParams.get("maxGrossSalary"))
      : undefined,
    minNetSalary: searchParams.get("minNetSalary")
      ? Number(searchParams.get("minNetSalary"))
      : undefined,
    maxNetSalary: searchParams.get("maxNetSalary")
      ? Number(searchParams.get("maxNetSalary"))
      : undefined,
    drillDown: searchParams.get("drillDown") === "true",
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const {
      country,
      sector,
      minExperience,
      maxExperience,
      minAge,
      maxAge,
      minGrossSalary,
      maxGrossSalary,
      minNetSalary,
      maxNetSalary,
      drillDown,
    } = parseSearchParams(searchParams);

    const conditions = buildWhereConditions(
      {
        country,
        sector,
        minExperience,
        maxExperience,
        minAge,
        maxAge,
        minGrossSalary,
        maxGrossSalary,
        minNetSalary,
        maxNetSalary,
      },
      drillDown
    );
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    if (drillDown && country) {
      const provinceData = await fetchProvinceData(whereClause);
      return NextResponse.json(
        { provinces: provinceData },
        { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=30" } }
      );
    }

    const countryData = await fetchCountryData(whereClause);
    return NextResponse.json(
      { countries: countryData },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=30" } }
    );
  } catch (error) {
    console.error("Error fetching map data:", error);
    return NextResponse.json({ error: "Failed to fetch map data" }, { status: 500 });
  }
}

function buildWhereConditions(params: MapDataParams, requireCity: boolean) {
  const conditions = [
    eq(salaryEntries.reviewStatus, "APPROVED"),
    isNotNull(salaryEntries.grossSalary),
  ];

  if (params.country) conditions.push(eq(salaryEntries.country, params.country));
  if (params.sector) conditions.push(eq(salaryEntries.sector, params.sector));
  if (params.minExperience !== undefined)
    conditions.push(sql`${salaryEntries.workExperience} >= ${params.minExperience}`);
  if (params.maxExperience !== undefined)
    conditions.push(sql`${salaryEntries.workExperience} <= ${params.maxExperience}`);
  if (params.minAge !== undefined) conditions.push(sql`${salaryEntries.age} >= ${params.minAge}`);
  if (params.maxAge !== undefined) conditions.push(sql`${salaryEntries.age} <= ${params.maxAge}`);
  if (params.minGrossSalary !== undefined)
    conditions.push(sql`${salaryEntries.grossSalary} >= ${params.minGrossSalary}`);
  if (params.maxGrossSalary !== undefined)
    conditions.push(sql`${salaryEntries.grossSalary} <= ${params.maxGrossSalary}`);
  if (params.minNetSalary !== undefined)
    conditions.push(sql`${salaryEntries.netSalary} >= ${params.minNetSalary}`);
  if (params.maxNetSalary !== undefined)
    conditions.push(sql`${salaryEntries.netSalary} <= ${params.maxNetSalary}`);

  if (requireCity) {
    conditions.push(isNotNull(salaryEntries.workCity));
  }

  return conditions;
}

async function buildCityLookupMap(country: string): Promise<Map<string, CityLookup>> {
  const cityData = await db
    .select({
      name: cities.name,
      countryCode: cities.countryCode,
      admin1Code: cities.admin1Code,
      admin2Code: cities.admin2Code,
      alternateNames: cities.alternateNames,
    })
    .from(cities)
    .where(eq(cities.country, country));

  const lookupMap = new Map<string, CityLookup>();

  for (const city of cityData) {
    if (!city.countryCode) continue;

    const cityLookup: CityLookup = {
      countryCode: city.countryCode,
      admin1Code: city.admin1Code,
      admin2Code: city.admin2Code,
    };

    lookupMap.set(city.name.toLowerCase(), cityLookup);

    if (city.alternateNames) {
      for (const alt of city.alternateNames.split(",")) {
        const normalizedAlt = alt.trim().toLowerCase();
        if (normalizedAlt && !lookupMap.has(normalizedAlt)) {
          lookupMap.set(normalizedAlt, cityLookup);
        }
      }
    }
  }

  return lookupMap;
}

async function fetchProvinceData(whereClause: any): Promise<ProvinceMapData[]> {
  const entries = await db
    .select({
      workCity: salaryEntries.workCity,
      grossSalary: salaryEntries.grossSalary,
      country: salaryEntries.country,
    })
    .from(salaryEntries)
    .where(whereClause);

  if (entries.length === 0) return [];

  const country = entries[0].country || "";
  const cityLookup = await buildCityLookupMap(country);
  const provinceGroups = groupEntriesByProvince(entries, cityLookup);

  return Array.from(provinceGroups.entries()).map(([isoCode, { salaries, lookup }]) => {
    const stats = calculateSalaryStats(salaries);
    const provinceName = getProvinceName(
      lookup.countryCode,
      lookup.admin1Code || undefined,
      lookup.admin2Code || undefined
    );

    return {
      id: isoCode,
      name: provinceName || isoCode,
      ...stats,
      admin1Code: lookup.admin1Code || undefined,
      admin2Code: lookup.admin2Code || undefined,
    };
  });
}

function groupEntriesByProvince(
  entries: Array<{ workCity: string | null; grossSalary: number | null }>,
  cityLookup: Map<string, CityLookup>
): Map<string, { salaries: number[]; lookup: CityLookup }> {
  const provinceGroups = new Map<string, { salaries: number[]; lookup: CityLookup }>();

  for (const entry of entries) {
    if (!entry.grossSalary || !entry.workCity) continue;

    const cityData = cityLookup.get(entry.workCity.toLowerCase());
    if (!cityData) continue;

    const isoCode = getISO3166Code(
      cityData.countryCode,
      cityData.admin1Code || undefined,
      cityData.admin2Code || undefined
    );
    if (!isoCode) continue;

    if (!provinceGroups.has(isoCode)) {
      provinceGroups.set(isoCode, { salaries: [], lookup: cityData });
    }
    provinceGroups.get(isoCode)!.salaries.push(entry.grossSalary);
  }

  return provinceGroups;
}

async function fetchCountryData(whereClause: any): Promise<CountryMapData[]> {
  const entries = await db
    .select({
      country: salaryEntries.country,
      grossSalary: salaryEntries.grossSalary,
    })
    .from(salaryEntries)
    .where(whereClause);

  const countryGroups = groupEntriesByCountry(entries);

  return Array.from(countryGroups.entries()).map(([countryName, salaries]) => {
    const stats = calculateSalaryStats(salaries);

    return {
      id: COUNTRY_CODE_MAP[countryName] || countryName.substring(0, 2).toUpperCase(),
      name: countryName,
      ...stats,
    };
  });
}

function groupEntriesByCountry(
  entries: Array<{ country: string | null; grossSalary: number | null }>
): Map<string, number[]> {
  const countryGroups = new Map<string, number[]>();

  for (const entry of entries) {
    if (!entry.country || !entry.grossSalary) continue;

    if (!countryGroups.has(entry.country)) {
      countryGroups.set(entry.country, []);
    }
    countryGroups.get(entry.country)!.push(entry.grossSalary);
  }

  return countryGroups;
}
