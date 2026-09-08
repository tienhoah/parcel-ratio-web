import { Component, computed, inject } from '@angular/core';
import { MapView } from './map-view/map-view';
import { ParcelService } from './parcel.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { toFeatureCollection } from './parcel-geojson';
import { Parcel } from './parcel';
import { cod, median, ratio } from './ratio-stats';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [MapView, DecimalPipe],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private parcels$ = inject(ParcelService).getAll();
  parcels = toSignal(this.parcels$, { initialValue: [] as Parcel[] });

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
}
