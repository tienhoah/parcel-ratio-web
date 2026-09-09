import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { WithinResult } from '../parcel';
import { ratio, ratioBucket } from '../ratio-stats';
import { RAMP } from '../ramp';

@Component({
  selector: 'app-panel-area',
  imports: [DecimalPipe],
  templateUrl: './panel-area.html',
  styleUrl: './panel-area.css',
})
export class PanelArea {
  result = input.required<WithinResult>();
  clear = output<void>();

  readonly RAMP = RAMP;
  readonly ratioBucket = ratioBucket;

  private sold = computed(() => this.result().parcels.filter((p) => p.lastSalePrice != null));
  soldCount = computed(() => this.sold().length);
  noSaleCount = computed(() => this.result().parcels.length - this.sold().length);

  /** sold parcels in the box, id + ratio, sorted by ratio ascending */
  rows = computed(() =>
    this.sold()
      .map((p) => ({ id: p.id, r: ratio(p)! }))
      .sort((a, b) => a.r - b.r),
  );

  /** median in its ramp colour — but not for the near-white 'mid' bucket, nor when there's no median */
  medianColour = computed(() => {
    const m = this.result().medianRatio;
    if (m <= 0) return null;
    const b = ratioBucket(m);
    return b === 'mid' ? null : RAMP[b];
  });

  /** the "Consistent, but low." finding fires only for a tight, low cluster */
  finding = computed(() => {
    const r = this.result();
    return r.medianRatio > 0 && r.medianRatio < 0.9 && r.cod <= 15;
  });
}
