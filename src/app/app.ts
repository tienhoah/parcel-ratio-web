import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { MapView } from './map-view/map-view';
import { ParcelService } from './parcel.service';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { toFeatureCollection } from './parcel-geojson';
import { Parcel, WithinResult } from './parcel';
import { cod, median, ratio, ratioBucket, type RatioBucket } from './ratio-stats';
import { haversineMetres } from './geo';
import { RAMP } from './ramp';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [MapView, DecimalPipe],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  readonly RAMP = RAMP;
  readonly rampBuckets: readonly RatioBucket[] = ['low', 'midLow', 'mid', 'midHigh', 'high'];

  private parcelService = inject(ParcelService);
  private destroyRef = inject(DestroyRef);

  private parcels$ = this.parcelService.getAll();
  parcels = toSignal(this.parcels$, { initialValue: [] as Parcel[] });

  mapView = viewChild(MapView);
  area = signal<WithinResult | null>(null);

  features = computed(() => toFeatureCollection(this.parcels()));

  private soldRatios = computed(() =>
    this.parcels()
      .map(ratio)
      .filter((r): r is number => r !== null),
  );

  medianRatio = computed(() => median(this.soldRatios()));
  codValue = computed(() => cod(this.soldRatios(), this.medianRatio()));
  totalCount = computed(() => this.parcels().length);
  soldCount = computed(() => this.soldRatios().length);

  // --- Screen 2: selected area ---

  /** template helpers */
  readonly ratioBucket = ratioBucket;
  readonly ratio = ratio;

  private areaSold = computed(() =>
    (this.area()?.parcels ?? []).filter((p) => p.lastSalePrice != null),
  );
  areaSoldCount = computed(() => this.areaSold().length);
  areaNoSaleCount = computed(() => (this.area()?.parcels.length ?? 0) - this.areaSold().length);

  /** sold parcels in the box, id + ratio, sorted by ratio ascending */
  areaRows = computed(() =>
    this.areaSold()
      .map((p) => ({ id: p.id, r: ratio(p)! }))
      .sort((a, b) => a.r - b.r),
  );

  /** the "Consistent, but low." finding fires only for a tight, low cluster */
  areaFinding = computed(() => {
    const a = this.area();
    return a != null && a.medianRatio > 0 && a.medianRatio < 0.9 && a.cod <= 15;
  });

  onArea(bbox: [number, number, number, number]): void {
    const [minLon, minLat, maxLon, maxLat] = bbox;
    this.parcelService
      .getWithin(minLon, minLat, maxLon, maxLat)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.area.set(result));
  }

  clearArea(): void {
    this.area.set(null);
    this.mapView()?.clearDraw();
  }

  // --- Screen 3: parcel detail ---

  detail = signal<{ parcel: Parcel; comps: Parcel[] } | null>(null);

  /** comparables with client-side distance from the selected parcel, its ratio */
  compRows = computed(() => {
    const d = this.detail();
    if (!d) return [];
    return d.comps.map((c) => ({
      id: c.id,
      date: c.lastSaleDate,
      price: c.lastSalePrice,
      r: ratio(c),
      metres: Math.round(
        haversineMetres(d.parcel.latitude, d.parcel.longitude, c.latitude, c.longitude),
      ),
    }));
  });

  onParcel(id: string): void {
    forkJoin({
      parcel: this.parcelService.getById(id),
      comps: this.parcelService.getComparables(id),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((d) => {
        this.detail.set(d);
        this.area.set(null);
        this.mapView()?.clearDraw();
      });
  }

  clearDetail(): void {
    this.detail.set(null);
  }
}
