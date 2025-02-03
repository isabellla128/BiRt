// src/app/artist-graph/artist-graph.component.ts
import { Component, ElementRef, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { ArtistSummaryModel } from '../../models/artistSummary.model';
import { SearchArtistService } from '../../services/searchArtist.service';

interface NodeModel {
  id: string;
  group: string;
}

interface LinksModel {
  source: string;
  target: string;
}

interface DataModel {
  nodes: NodeModel[];
  links: LinksModel[];
}

interface ArtistGeneralModel {
  artists: ArtistSummaryModel[];
}

@Component({
  selector: 'app-artist-graph',
  standalone: true,
  templateUrl: './artist-graph.page.html',
  styleUrls: ['./artist-graph.page.scss'],
})
export class ArtistGraphComponent implements OnInit {
  data: DataModel = { nodes: [], links: [] };

  constructor(
    private el: ElementRef,
    private readonly searchService: SearchArtistService
  ) {}

  ngOnInit(): void {
    // this.createGraph();
    // this.searchService.getArtists().subscribe(
    //   (artists: ArtistGeneralModel) => {
    //     console.log('Artists:', artists);
    //     const nodes = this.mapArtistsToNodes(artists.artists);
    //     //aici am doar un gen, dar ei canta mai multe
    //     const links = this.mapArtistsToLinks(artists.artists);
    //     this.data = { nodes: nodes, links: links };
    //     console.log(this.data);
    //   },
    //   (error:any) => {
    //     console.error('Error fetching artists:', error);
    //   }
    // );
  }

  createGraph(): void {
    this.data = {
      nodes: [
        { id: 'Artist A', group: 'artist' },
        { id: 'Artist B', group: 'artist' },
        { id: 'Jazz', group: 'genre' },
        { id: 'Pop', group: 'genre' },
        { id: 'Rock', group: 'genre' },
      ],
      links: [
        { source: 'Artist A', target: 'Jazz' },
        { source: 'Artist A', target: 'Pop' },
        { source: 'Artist B', target: 'Pop' },
        { source: 'Artist B', target: 'Rock' },
      ],
    };

    const width = 600;
    const height = 400;

    const svg = d3
      .select(this.el.nativeElement)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const simulation = d3
      .forceSimulation(this.data.nodes as any)
      .force(
        'link',
        d3.forceLink(this.data.links).id((d: any) => d.id)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg
      .append('g')
      .attr('stroke', '#aaa')
      .selectAll('line')
      .data(this.data.links)
      .enter()
      .append('line')
      .attr('stroke-width', 2);

    const node = svg
      .append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(this.data.nodes)
      .enter()
      .append('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => (d.group === 'artist' ? '#ff7f0e' : '#1f77b4'))
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

    const label = svg
      .append('g')
      .selectAll('text')
      .data(this.data.nodes)
      .enter()
      .append('text')
      .text((d: any) => d.id)
      .attr('x', 6)
      .attr('y', 3)
      .style('font-size', '12px');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

      label.attr('x', (d: any) => d.x + 10).attr('y', (d: any) => d.y);
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

  mapArtistsToNodes(artists: ArtistSummaryModel[]): NodeModel[] {
    return artists.map((artist: ArtistSummaryModel) => ({
      id: artist.name,
      group: 'artist',
    }));
  }

  mapArtistsToLinks(artists: ArtistSummaryModel[]): LinksModel[] {
    return artists.map((artist: ArtistSummaryModel) => ({
      source: artist.name,
      target: artist.genre,
    }));
  }
}
