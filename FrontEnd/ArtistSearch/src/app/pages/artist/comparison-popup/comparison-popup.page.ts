import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ArtistSummaryModel } from '../../../models/artistSummary.model';
import { ComparisonChartComponent } from './comparison-chart/comparison-chart.page';

@Component({
  selector: 'app-comparison-popup',
  standalone: true,
  imports: [CommonModule, ComparisonChartComponent],
  templateUrl: './comparison-popup.page.html',
  styleUrls: ['./comparison-popup.page.scss'],
})
export class ComparisonPopupComponent {
  @Input() selectedArtists: ArtistSummaryModel[] = [];
  @Input() show = false;
  @Output() discard = new EventEmitter<void>();

  constructor() {}
}
