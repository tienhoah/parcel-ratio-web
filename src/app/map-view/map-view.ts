import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { GeoJSONSource, Map as MaplibreMap } from 'maplibre-gl';
import type { FeatureCollection, Point } from 'geojson';
import { ringToBbox, type ParcelProps } from '../parcel-geojson';
import { environment } from '../../environments/environment';
import { RAMP } from '../ramp';
import { TerraDraw, TerraDrawRectangleMode } from 'terra-draw';
import { TerraDrawMapLibreGLAdapter } from 'terra-draw-maplibre-gl-adapter';

@Component({
  selector: 'app-map-view',
  styleUrl: './map-view.css',
  template: '',
})
export class MapView {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  features = input<FeatureCollection<Point, ParcelProps> | null>(null);
  areaDrawn = output<[number, number, number, number]>();

  private readonly map = signal<MaplibreMap | undefined>(undefined);
  private readonly styleReady = signal(false);

  private draw?: TerraDraw;

  constructor() {
    afterNextRender(() => {
      const map = new MaplibreMap({
        container: this.host.nativeElement,
        style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${environment.maptilerKey}`,
        center: [-123.13, 49.24],
        zoom: 11,
      });

      map.on('error', (e) => console.error('[map]', e.error));
      map.on('load', () => {
        this.styleReady.set(true);
        const draw = new TerraDraw({
          adapter: new TerraDrawMapLibreGLAdapter({ map }),
          modes: [new TerraDrawRectangleMode()],
        });
        draw.start();
        draw.setMode('static');
        draw.on('finish', (id, context) => {
          if (context.mode !== 'rectangle') return;
          const feature = draw.getSnapshot().find((f) => f.id === id);
          if (!feature || feature.geometry.type !== 'Polygon') return;
          const bbox = ringToBbox(feature.geometry.coordinates[0]); // helper
          this.areaDrawn.emit(bbox);
          draw.setMode('static'); // disarm after one rectangle
        });
        this.draw = draw;
      });
      requestAnimationFrame(() => map.resize());
      this.destroyRef.onDestroy(() => {
        this.draw?.stop();
        map.remove();
      });
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
          RAMP.low,
          'midLow',
          RAMP.midLow,
          'mid',
          RAMP.mid,
          'midHigh',
          RAMP.midHigh,
          'high',
          RAMP.high,
          RAMP.none,
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
        'circle-stroke-color': RAMP.none,
      },
    });
  }

  startDraw(): void {
    this.draw?.setMode('rectangle');
  }

  clearDraw(): void {
    this.draw?.clear();
    this.draw?.setMode('static');
  }
}
