import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import * as d3plus from 'd3plus';
import { ByCountryResponseModel } from '../../models/responseSummarize.nodel';

@Component({
  selector: 'app-by-country-bar-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="by-country-bar-chart"></div>`,
})
export class ByCountryBarChartComponent implements OnInit {
  @Input() data: ByCountryResponseModel[] = [];
  @Input() width!: number;
  @Input() height!: number;

  // isGraphShown: boolean = false;
  isSmallScreen: boolean = false;
  select: string = '';

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth <= 768;
    if (this.isSmallScreen) {
      this.width = 300;
      this.height = 500;
    }

    if (this.data.length > 0) {
      this.createSummarizeBarChart();
    }
  }

  createSummarizeBarChart(): void {
    // new d3plus.BarChart()
    //   .select('.by-country-bar-chart')
    //   .width(this.width)
    //   .height(this.height)
    //   .config({
    //     data: this.data,
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
      .data(this.data)
      .groupBy('country')
      .x('country')
      .y('count')
      .tooltip(['country', 'count'])
      .width(this.width)
      .height(this.height)
      .render();
  }
}
