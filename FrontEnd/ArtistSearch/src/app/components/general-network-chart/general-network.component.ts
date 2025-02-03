import { CommonModule } from '@angular/common';
import { Component, ElementRef, Input, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { ArtistSummaryModel } from '../../models/artistSummary.model';
import { IdGroupModel, SourceTargetModel } from '../models';

interface NodeModel {
  id: string;
  group: string;
}

interface LinksModel {
  source: string;
  target: string;
}

@Component({
  selector: 'app-general-network-chart',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="general-network-chart"></div>`,
})
export class GeneralNetworkChartComponent implements OnInit {
  @Input() artists!: ArtistSummaryModel[];
  @Input() width!: number;
  @Input() height!: number;

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    if (this.artists && this.artists.length > 0) {
      this.createNetworkChart();
    }
  }

  createNetworkChart(): void {
    const nodes = this.extractNodes(this.artists);
    const links = this.extractLinks(this.artists);
    const margin = 20;

    const svg = d3
      .select(this.el.nativeElement)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .call(
        d3
          .zoom()
          .scaleExtent([0.5, 5]) // Limite pentru zoom in/out
          .on('zoom', (event: any) => g.attr('transform', event.transform))
      );

    const g = svg.append('g'); // Grup pentru linkuri, noduri și etichete

    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        'link',
        d3
          .forceLink(links)
          .id((d: any) => d.id)
          .distance(50)
      )
      .force('charge', d3.forceManyBody().strength(-50))
      .force('center', d3.forceCenter(this.width / 2, this.height / 2))
      .force('collision', d3.forceCollide().radius(20));

    const link = g
      .append('g')
      .attr('stroke', '#aaa')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke-width', 2);

    const node = g
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => {
        // Aplicăm culori diferite pentru noduri pe baza grupului
        if (d.group === 'artist') {
          return 'rgb(119, 75, 119)'; // Culorea roz pentru artisti
        } else if (d.group === 'genre') {
          return 'rgb(245, 127, 245)'; // Nuanță deschisă pentru genuri
        } else {
          return '#fa9ac4'; // Nuanță roz deschisă pentru alte noduri
        }
      })
      .call(
        d3
          .drag()
          .on('start', (event: any, d: any) =>
            this.dragStarted(event, d, simulation)
          )
          .on('drag', (event: any, d: any) => this.dragged(event, d))
          .on('end', (event: any, d: any) =>
            this.dragEnded(event, d, simulation)
          )
      );

    const label = g
      .append('g')
      .selectAll('text')
      .data(nodes)
      .enter()
      .append('text')
      .text((d: any) => d.id)
      .attr('x', 6)
      .attr('y', 3)
      .style('font-size', '12px')
      .attr('fill', (d: any) => {
        // Aplicăm culori diferite pentru noduri pe baza grupului
        if (d.group === 'artist') {
          return 'rgba(196, 151, 182, 0.88)'; // Culorea roz pentru artisti
        } else if (d.group === 'genre') {
          return 'rgb(255, 135, 255)'; // Nuanță deschisă pentru genuri
        } else {
          return '#fa9ac4'; // Nuanță roz deschisă pentru alte noduri
        }
      })
      .style('opacity', 0) // Ascunde textul inițial
      .style('user-select', 'none') // Previne selecția textului
      .style('pointer-events', 'none'); // Previne interacțiunile cu textul

    // Adăugăm textul pentru nodurile de tip "genre" să fie vizibil tot timpul
    label.filter((d: any) => d.group === 'genre').style('opacity', 1);

    // Adăugăm evenimentul de hover doar pentru nodurile de tip "artist"
    node
      .filter((d: any) => d.group === 'artist') // Filtrăm doar nodurile de tip "artist"
      .on('mouseover', (event: any, d: any) => {
        // Arată textul doar pentru nodurile de tip "artist"
        label
          .filter((labelData: any) => labelData.id === d.id)
          .style('opacity', 1)
          .style('pointer-events', 'auto'); // Permite interacțiuni cu textul când e vizibil
      })
      .on('mouseout', (event: any, d: any) => {
        // Ascunde textul doar pentru nodurile de tip "artist"
        label
          .filter((labelData: any) => labelData.id === d.id)
          .style('opacity', 0)
          .style('pointer-events', 'none'); // Previne interacțiunile cu textul când nu e vizibil
      });

    simulation.on('tick', () => {
      nodes.forEach((d: any) => {
        d.x = Math.max(margin, Math.min(this.width - margin, d.x));
        d.y = Math.max(margin, Math.min(this.height - margin, d.y));
      });

      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x + 12).attr('y', (d: any) => d.y);
    });
  }

  dragStarted(event: any, d: any, simulation: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  dragged(event: any, d: any) {
    d.fx = event.x;
    d.fy = event.y;
  }

  dragEnded(event: any, d: any, simulation: any) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  private extractNodes(artists: ArtistSummaryModel[]): IdGroupModel[] {
    const nodesSet = new Set<IdGroupModel>();
    const genresSet = new Set<string>();

    artists.forEach((artist) => {
      if (artist.name && artist.genre) {
        nodesSet.add({ id: artist.name, group: 'artist' });
        genresSet.add(artist.genre);
      }
    });

    genresSet.forEach((genre) => {
      nodesSet.add({ id: genre, group: 'genre' });
    });

    return Array.from(nodesSet);
  }

  private extractLinks(artists: ArtistSummaryModel[]): SourceTargetModel[] {
    const links: SourceTargetModel[] = [];

    artists.forEach((artist) => {
      if (artist.name && artist.genre) {
        links.push({ source: artist.name, target: artist.genre });
      }
    });

    return links;
  }
}
