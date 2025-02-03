import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import * as d3plus from 'd3plus';
import { ArtistModel } from '../../models/artist.model';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: ``,
})
export class BarChartComponent implements OnInit {
  @Input() artist1!: ArtistModel;
  @Input() artist2!: ArtistModel;
  @Input() width!: number;
  @Input() height!: number;

  ngOnInit(): void {
    if (this.artist1 && this.artist2) {
      console.log('bar');
      this.createBarChart();
    }
  }

  createBarChart(): void {
    const artist1Awards =
      this.artist1.awards !== undefined &&
      this.artist1.awards !== null &&
      this.artist1.awards.length !== 0
        ? this.artist1.awards.length
        : 0;
    const artist1Nominations =
      this.artist1.nominations !== undefined &&
      this.artist1.nominations !== null &&
      this.artist1.nominations.length !== 0
        ? this.artist1.nominations.length
        : 0;

    const artist2Awards =
      this.artist2.awards !== undefined &&
      this.artist2.awards !== null &&
      this.artist2.awards.length !== 0
        ? this.artist2.awards.length
        : 0;
    const artist2Nominations =
      this.artist2.nominations !== undefined &&
      this.artist2.nominations !== null &&
      this.artist2.nominations.length !== 0
        ? this.artist2.nominations.length
        : 0;

    if (
      artist1Awards === 0 &&
      artist1Nominations === 0 &&
      artist2Awards === 0 &&
      artist2Nominations === 0
    ) {
      const paragraph = document.createElement('p');
      paragraph.style.color = 'white';
      paragraph.style.fontSize = '14px';
      paragraph.textContent = 'No Awards or Nominations.';

      document.getElementsByClassName('bar-chart')[0].appendChild(paragraph);
    } else {
      const data = [
        {
          artist: this.artist1.name,
          type: 'Awards',
          value: artist1Awards,
        },
        {
          artist: this.artist1.name,
          type: 'Nominations',
          value: artist1Nominations,
        },
        {
          artist: this.artist2.name,
          type: 'Awards',
          value: artist2Awards,
        },
        {
          artist: this.artist2.name,
          type: 'Nominations',
          value: artist2Nominations,
        },
      ];

      new d3plus.BarChart()
        .select('.bar-chart')
        .data(data)
        .groupBy('artist')
        .color((d: any) =>
          d.artist === this.artist1.name ? '#f92c85' : '#5ebec4'
        )
        .x('type')
        .y('value')
        .tooltip(['type', 'value'])
        .width(this.width)
        .height(this.height)
        .render();
    }
  }
}
