import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../environments/environment';
import { Observable } from 'rxjs';
import { Parcel, WithinResult } from './parcel';

@Injectable({ providedIn: 'root' })
export class ParcelService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;

  getAll(): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.base}/parcels`);
  }

  getById(id: string): Observable<Parcel> {
    return this.http.get<Parcel>(`${this.base}/parcels/${id}`);
  }

  getComparables(id: string): Observable<Parcel[]> {
    return this.http.get<Parcel[]>(`${this.base}/parcels/${id}/comparables`);
  }

  getWithin(
    minLon: number,
    minLat: number,
    maxLon: number,
    maxLat: number,
  ): Observable<WithinResult> {
    const bbox = `${minLon},${minLat},${maxLon},${maxLat}`;
    return this.http.get<WithinResult>(`${this.base}/parcels/within`, { params: { bbox } });
  }
}
