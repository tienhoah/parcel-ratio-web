import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import type { ParcelProps } from '../parcel-geojson';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map-view',
  styleUrl: './map-view.css',
  template: '',
})
export class MapView {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  features = input<FeatureCollection<Point, ParcelProps> | null>(null);

  private readonly map = signal<MaplibreMap | undefined>(undefined);
  private readonly styleReady = signal(false);

  constructor() {
    afterNextRender(() => {
      const map = new MaplibreMap({
        container: this.host.nativeElement,
        style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${environment.maptilerKey}`,
        center: [-123.13, 49.24],
        zoom: 11,
      });

      map.on('error', (e) => console.error('[map]', e.error));
      map.on('load', () => this.styleReady.set(true));
      requestAnimationFrame(() => map.resize());
      this.destroyRef.onDestroy(() => map.remove());
      this.map.set(map);
    });

    effect(() => {
      const map = this.map();
      const fc = this.features();
      if (!map || !this.styleReady() || !fc) return;
      this.syncParcels(map, fc);
    });
  }

  private syncParcels(map: MaplibreMap, fc: FeatureCollection<Point, ParcelProps>): void {
    const existing = map.getSource<GeoJSONSource>('parcels');
    if (existing) {
      existing.setData(fc);
      return;
    }

    map.addSource('parcels', { type: 'geojson', data: fc });

    map.addLayer({
      id: 'parcels',
      type: 'circle',
      source: 'parcels',
      filter: ['!=', ['get', 'bucket'], 'none'],
      paint: {
        'circle-radius': 5,
        'circle-color': [
          'match',
          ['get', 'bucket'],
          'low',
          '#1c5cab',
          'midLow',
          '#5598e7',
          'mid',
          '#e8e6e0',
          'midHigh',
          '#e8807f',
          'high',
          '#b02c2c',
          '#b8b6ae',
        ],
        'circle-stroke-width': 1,
        'circle-stroke-color': 'rgba(11,11,11,0.15)',
      },
    });

    map.addLayer({
      id: 'parcels-nosale',
      type: 'circle',
      source: 'parcels',
      filter: ['==', ['get', 'bucket'], 'none'],
      paint: {
        'circle-radius': 5,
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#b8b6ae',
      },
    });
  }
}
