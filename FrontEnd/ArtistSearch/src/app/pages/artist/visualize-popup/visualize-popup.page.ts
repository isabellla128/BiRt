import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { GeneralNetworkChartComponent } from '../../../components/general-network-chart/general-network.component';
import { ArtistSummaryModel } from '../../../models/artistSummary.model';

@Component({
  selector: 'app-visualize-popup',
  standalone: true,
  imports: [CommonModule, GeneralNetworkChartComponent],
  templateUrl: './visualize-popup.page.html',
  styleUrls: ['./visualize-popup.page.scss'],
})
export class VisualizePopupComponent {
  @Input() artists: ArtistSummaryModel[] = [];
  @Input() show = false;
  @Output() discard = new EventEmitter<void>();
  width: number = 850;
  height: number = 550;
  isGraphShown: boolean = false;
  isSmallScreen: boolean = false;

  constructor() {}

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth <= 768;
    if (this.isSmallScreen) {
      this.width = 300;
      this.height = 500;
    }
  }
}
