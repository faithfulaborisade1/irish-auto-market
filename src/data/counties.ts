// src/data/counties.ts - Irish Counties Data
export const IRISH_COUNTIES = [
  'Antrim',
  'Armagh',
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Derry',
  'Donegal',
  'Down',
  'Dublin',
  'Fermanagh',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Tyrone',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow'
];

// For URL-friendly county names (lowercase, hyphenated)
export const COUNTY_SLUGS = IRISH_COUNTIES.map(county =>
  county.toLowerCase().replace(/\s+/g, '-')
);

// Convert slug back to proper county name
export const getCountyFromSlug = (slug: string): string => {
  const index = COUNTY_SLUGS.indexOf(slug);
  return index !== -1 ? IRISH_COUNTIES[index] : '';
};