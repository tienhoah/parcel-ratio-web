import type { Parcel } from './parcel';
import type { FeatureCollection, Point } from 'geojson';
import { ratio, type RatioBucket, ratioBucket } from './ratio-stats';

export type ParcelProps = { id: string; bucket: RatioBucket };

export const toFeatureCollection = (parcels: Parcel[]): FeatureCollection<Point, ParcelProps> => ({
  type: 'FeatureCollection',
  features: parcels.map((p) => ({
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
    properties: { id: p.id, bucket: ratioBucket(ratio(p)) },
  })),
});
