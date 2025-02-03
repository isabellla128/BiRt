import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ArtistGraphComponent } from '../artist-graph/artist-graph.page';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, RouterModule, ArtistGraphComponent],
  templateUrl: './graph.page.html',
  styleUrls: ['./graph.page.scss'],
})
export class GraphPage {
  constructor() {}
}
