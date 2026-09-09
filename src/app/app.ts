import { Component, computed, DestroyRef, inject, signal, viewChild } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MapView } from './map-view/map-view';
import { PanelAll } from './panel-all/panel-all';
import { PanelArea } from './panel-area/panel-area';
import { PanelParcel, type ParcelDetail } from './panel-parcel/panel-parcel';
import { ParcelService } from './parcel.service';
import { toFeatureCollection } from './parcel-geojson';
import { Parcel, type WithinResult } from './parcel';

@Component({
  selector: 'app-root',
  imports: [MapView, PanelAll, PanelArea, PanelParcel],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private parcelService = inject(ParcelService);
  private destroyRef = inject(DestroyRef);

  private parcels$ = this.parcelService.getAll();
  parcels = toSignal(this.parcels$, { initialValue: [] as Parcel[] });
  features = computed(() => toFeatureCollection(this.parcels()));

  mapView = viewChild(MapView);

  area = signal<WithinResult | null>(null);
  detail = signal<ParcelDetail | null>(null);

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
