export interface Parcel {
  id: string;
  address: string;
  neighbourhood: string;
  latitude: number;
  longitude: number;
  landAreaSqFt: number;
  buildingAreaSqFt: number;
  yearBuilt: number;
  bedrooms: number;
  assessedValue: number;
  lastSaleDate: string | null;
  lastSalePrice: number | null;
}

export interface WithinResult {
  parcels: Parcel[];
  medianRatio: number;
  cod: number;
}
