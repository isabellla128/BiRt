import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as d3plus from 'd3plus';
import { ArtistModel } from '../../models/artist.model';
import { IdGroupModel, SourceTargetModel } from '../models';

@Component({
  selector: 'app-network-chart',
  standalone: true,
  imports: [CommonModule],
  template: ``,
})
export class NetworkChartComponent implements OnInit {
  @Input() artists!: ArtistModel[];
  @Input() width!: number;
  @Input() height!: number;
  @Output() chartRendered = new EventEmitter<boolean>();
  
  ngOnInit(): void {
    if (this.artists.length > 0) {
      console.log('network');
      this.createNetworkChart();
    }
  }

  createNetworkChart(): void {
    const nodes = this.extractNodes(this.artists);
    const links = this.extractLinks(this.artists);

    console.log('Nodes:', nodes);
    console.log('Links:', links);

    // Validate nodes and links
    if (!nodes || !links || nodes.length === 0 || links.length === 0) {
      console.error('Invalid nodes or links data');
      return;
    }

    new d3plus.Network()
      .select('.network-chart')
      .links(links)
      .nodes(nodes)
      .width(this.width)
      .height(this.height)
      .shapeConfig({
        r: 15,
      })
      .render();

    this.chartRendered.emit(true);
  }

  private extractNodes(artists: ArtistModel[]): IdGroupModel[] {
    const nodesSet = new Set<IdGroupModel>();

    artists.forEach((artist) => {
      nodesSet.add({ id: artist.name, group: 'artist' });

      artist.genres.forEach((genre) => {
        nodesSet.add({ id: genre.label, group: 'genre' });
      });
    });

    return Array.from(nodesSet);
  }

  private extractLinks(artists: ArtistModel[]): SourceTargetModel[] {
    const links: SourceTargetModel[] = [];

    artists.forEach((artist) => {
      artist.genres.forEach((genre) => {
        links.push({ source: artist.name, target: genre.label });
      });
    });

    return links;
  }
}
