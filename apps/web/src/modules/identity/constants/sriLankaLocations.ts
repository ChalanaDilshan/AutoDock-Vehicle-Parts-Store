export const SRI_LANKA_DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
] as const;

export type SriLankaDistrict = (typeof SRI_LANKA_DISTRICTS)[number];

export const SRI_LANKA_PROVINCES = [
  'Central',
  'Eastern',
  'North Central',
  'North Western',
  'Northern',
  'Sabaragamuwa',
  'Southern',
  'Uva',
  'Western',
] as const;

export type SriLankaProvince = (typeof SRI_LANKA_PROVINCES)[number];

export const DISTRICT_TO_PROVINCE: Record<SriLankaDistrict, SriLankaProvince> = {
  Ampara: 'Eastern',
  Anuradhapura: 'North Central',
  Badulla: 'Uva',
  Batticaloa: 'Eastern',
  Colombo: 'Western',
  Galle: 'Southern',
  Gampaha: 'Western',
  Hambantota: 'Southern',
  Jaffna: 'Northern',
  Kalutara: 'Western',
  Kandy: 'Central',
  Kegalle: 'Sabaragamuwa',
  Kilinochchi: 'Northern',
  Kurunegala: 'North Western',
  Mannar: 'Northern',
  Matale: 'Central',
  Matara: 'Southern',
  Monaragala: 'Uva',
  Mullaitivu: 'Northern',
  'Nuwara Eliya': 'Central',
  Polonnaruwa: 'North Central',
  Puttalam: 'North Western',
  Ratnapura: 'Sabaragamuwa',
  Trincomalee: 'Eastern',
  Vavuniya: 'Northern',
};

export function getProvinceForDistrict(district: string): string {
  return DISTRICT_TO_PROVINCE[district as SriLankaDistrict] || '';
}
