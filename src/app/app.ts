import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ParcelService } from './parcel.service';

@Component({
  imports: [],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private svc = inject(ParcelService);
  protected readonly parcels = toSignal(this.svc.getAll(), { initialValue: [] });
}
