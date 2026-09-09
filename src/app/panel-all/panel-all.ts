import { Component, computed, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Parcel } from '../parcel';
import { cod, median, ratio, type RatioBucket } from '../ratio-stats';
import { RAMP } from '../ramp';

@Component({
  selector: 'app-panel-all',
  imports: [DecimalPipe],
  templateUrl: './panel-all.html',
  styleUrl: './panel-all.css',
})
export class PanelAll {
  parcels = input.required<Parcel[]>();
  draw = output<void>();

  readonly RAMP = RAMP;
  readonly rampBuckets: readonly RatioBucket[] = ['low', 'midLow', 'mid', 'midHigh', 'high'];

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
