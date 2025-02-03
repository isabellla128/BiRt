import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import * as d3plus from 'd3plus';
import { ResponseSummarizeModel } from '../../models/responseSummarize.nodel';

@Component({
  selector: 'app-summarize-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="by-country-bar-chart"></div>
    <h2>Artists by Genre</h2>
    <div class="by-genre-bar-chart"></div>

    <h2>Artists by Decade</h2>
    <div class="by-decade-bar-chart"></div> `,
  styles: `.artists {
    margin-top: 20px;
    color: white;
  }
  h2 {
  position: relative;
  color: white;
  font-size: 18px;
  z-index: 100;
}`,
})
export class SummarizeBarChartComponent implements OnInit {
  @Input() data!: ResponseSummarizeModel;
  @Input() width!: number;
  @Input() height!: number;

  isSmallScreen: boolean = false;
  select: string = '';

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth <= 768;
    if (this.isSmallScreen) {
      this.width = 300;
      this.height = 500;
    }

    if (this.data) {
      console.log(this.data);
      this.createSummarizeBarChart();
    }
  }

  createSummarizeBarChart(): void {
    // new d3plus.BarChart()
    //   .select('.by-country-bar-chart')
    //   .width(this.width)
    //   .height(this.height)
    //   .config({
    //     data: this.data.byCountry,
    //     groupBy: 'country',
    //     x: 'country',
    //     y: 'count',
    //     text: {
    //       fill: 'white',
    //       fontColor: 'white',
    //     },
    //     xConfig: {
    //       tickFontColor: 'white',
    //       titleConfig: { fontColor: 'white' },
    //     },
    //     yConfig: {
    //       tickFontColor: 'white',
    //       titleConfig: { fontColor: 'white' },
    //     },
    //     shapeConfig: {
    //       labelConfig: {
    //         fontColor: 'white',
    //       },
    //     },
    //     legendConfig: {
    //       labelConfig: {
    //         fontColor: 'white',
    //       },
    //     },
    //   })
    //   .render();
    new d3plus.BarChart()
      .select('.by-country-bar-chart')
      .data(this.data.byCountry)
      .groupBy('country')
      .x('country')
      .y('count')
      .tooltip(['country', 'count'])
      .width(this.width)
      .height(this.height)
      .render();

    new d3plus.BarChart()
      .select('.by-genre-bar-chart')
      .data(this.data.byGenre)
      .groupBy('genre')
      .x('genre')
      .y('count')
      .tooltip(['genre', 'count'])
      .width(this.width)
      .height(this.height)
      .render();

    new d3plus.BarChart()
      .select('.by-decade-bar-chart')
      .data(this.data.byDecade)
      .groupBy('decade')
      .x('decade')
      .y('count')
      .tooltip(['decade', 'count'])
      .width(this.width)
      .height(this.height)
      .render();
  }
}
