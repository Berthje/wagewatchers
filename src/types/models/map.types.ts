export interface BaseMapData {
  id: string;
  name: string;
  count: number;
  avgSalary: number;
  medianSalary: number;
  minSalary: number;
  maxSalary: number;
}

export type CountryMapData = BaseMapData;

export interface ProvinceMapData extends BaseMapData {
  admin1Code?: string;
  admin2Code?: string;
}

export interface CityLookup {
  countryCode: string;
  admin1Code: string | null;
  admin2Code: string | null;
}

export interface SalaryStats {
  count: number;
  avgSalary: number;
  medianSalary: number;
  minSalary: number;
  maxSalary: number;
}

export interface MapDataResponse {
  countries?: CountryMapData[];
  provinces?: ProvinceMapData[];
}

export interface MapFilters {
  sector?: string;
  minExperience?: number;
  maxExperience?: number;
  minAge?: number;
  maxAge?: number;
  minGrossSalary?: number;
  maxGrossSalary?: number;
  minNetSalary?: number;
  maxNetSalary?: number;
}

export interface MapDataParams extends MapFilters {
  country?: string;
}
