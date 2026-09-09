import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Parcel } from '../parcel';
import { ratio, ratioBucket } from '../ratio-stats';
import { haversineMetres } from '../geo';
import { RAMP } from '../ramp';

export interface ParcelDetail {
  parcel: Parcel;
  comps: Parcel[];
}

@Component({
  selector: 'app-panel-parcel',
  imports: [DecimalPipe],
  templateUrl: './panel-parcel.html',
  styleUrl: './panel-parcel.css',
})
export class PanelParcel {
  detail = input.required<ParcelDetail>();
  back = output<void>();

  readonly RAMP = RAMP;
  readonly ratio = ratio;
  readonly ratioBucket = ratioBucket;

  /** comparables with client-side distance from the selected parcel, and its ratio */
  compRows = computed(() => {
    const { parcel, comps } = this.detail();
    return comps.map((c) => ({
      id: c.id,
      date: c.lastSaleDate,
      price: c.lastSalePrice,
      r: ratio(c),
      metres: Math.round(
        haversineMetres(parcel.latitude, parcel.longitude, c.latitude, c.longitude),
      ),
    }));
  });
}
