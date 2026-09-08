import { Component } from '@angular/core';
import { MapView } from './map-view/map-view';

@Component({
  selector: 'app-root',
  imports: [MapView],
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {}
