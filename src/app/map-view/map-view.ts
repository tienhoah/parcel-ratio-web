import { afterNextRender, Component, DestroyRef, ElementRef, inject } from '@angular/core';
import { Map as MaplibreMap } from 'maplibre-gl';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-map-view',
  styleUrl: './map-view.css',
  template: '',
})
export class MapView {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /** The MapLibre instance. Available after the first render; undefined before. */
  map?: MaplibreMap;

  constructor() {
    afterNextRender(() => {
      const map = new MaplibreMap({
        container: this.host.nativeElement,
        style: `https://api.maptiler.com/maps/dataviz-light/style.json?key=${environment.maptilerKey}`,
        center: [-123.13, 49.24],
        zoom: 11,
      });

      map.on('error', (e) => console.error('[map]', e.error));
      map.on('load', () => console.log('[map] load'));

      // afterNextRender fires after the DOM is updated but not necessarily after
      // the browser has resolved flex layout — nudge MapLibre to re-measure.
      requestAnimationFrame(() => map.resize());

      this.map = map;
      this.destroyRef.onDestroy(() => map.remove());
    });
  }
}
