import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'app-chart',
  templateUrl: './chart.page.html',
  styleUrls: ['./chart.page.scss'], // Ensure this path is correct
})
export class ChartPage implements OnInit {
  private data = [25, 30, 45, 60, 20, 65, 75];
  private svg: any;
  private margin = 50;
  private width = 600 - this.margin * 2;
  private height = 400 - this.margin * 2;

  constructor() {}

  ngOnInit(): void {
    this.createSvg();
    this.drawBars(this.data);
  }

  private createSvg(): void {
    this.svg = d3
      .select('#chart')
      .append('svg')
      .attr('width', this.width + this.margin * 2)
      .attr('height', this.height + this.margin * 2)
      .append('g')
      .attr('transform', 'translate(' + this.margin + ',' + this.margin + ')');
  }

  private drawBars(data: number[]): void {
    const x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(data.map((_, i) => i.toString()))
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data) as number])
      .range([this.height, 0]);

    this.svg
      .append('g')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(d3.axisBottom(x));

    this.svg.append('g').call(d3.axisLeft(y));

    this.svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (_: any, i: any) => x(i.toString())!)
      .attr('y', (d: any) => y(d))
      .attr('width', x.bandwidth())
      .attr('height', (d: any) => this.height - y(d))
      .attr('fill', '#69b3a2');
  }
}
