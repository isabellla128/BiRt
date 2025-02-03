import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GeneralNetworkChartComponent } from '../../../components/general-network-chart/general-network.component';
import { ArtistSummaryModel } from '../../../models/artistSummary.model';
import { SearchArtistService } from '../../../services/searchArtist.service';

@Component({
  selector: 'app-visualize-popup',
  standalone: true,
  imports: [CommonModule, GeneralNetworkChartComponent],
  templateUrl: './summarize-popup.page.html',
  styleUrls: [
    '../visualize-popup/visualize-popup.page.scss',
    './summarize-popup.page.html',
  ],
})
export class VisualizePopupComponent {
  @Input() artists: ArtistSummaryModel[] = [];
  @Input() show = false;
  @Output() discard = new EventEmitter<void>();
  width: number = 850;
  height: number = 550;
  isGraphShown: boolean = false;
  isSmallScreen: boolean = false;

  constructor(private readonly searchArtistService: SearchArtistService) {}

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth <= 768;
    if (this.isSmallScreen) {
      this.width = 300;
      this.height = 500;
    }

    this.searchArtistService.getSummarize().subscribe((response) => {
      console.log(response);
    });
  }
}
