import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ByCountryBarChartComponent } from '../../../components/summarize-bar-chart/by-country-bar-chart.component';
import { ByDecadeBarChartComponent } from '../../../components/summarize-bar-chart/by-decade-bar-chart.component';
import { ByGenreBarChartComponent } from '../../../components/summarize-bar-chart/by-genre-bar-chart.component';
import { FilterModel } from '../../../models/filter.model';
import { ResponseSummarizeModel } from '../../../models/responseSummarize.nodel';
import { SearchArtistService } from '../../../services/searchArtist.service';

@Component({
  selector: 'app-summarize-popup',
  standalone: true,
  imports: [
    CommonModule,
    ByCountryBarChartComponent,
    ByGenreBarChartComponent,
    ByDecadeBarChartComponent,
  ],
  templateUrl: './summarize-popup.page.html',
  styleUrls: [
    '../comparison-popup/comparison-popup.page.scss',
    './summarize-popup.page.scss',
  ],
  providers: [SearchArtistService],
})
export class SummarizePopupComponent {
  @Input() filters!: FilterModel;
  @Input() show = false;
  @Output() discard = new EventEmitter<void>();
  data: ResponseSummarizeModel | undefined;
  isGraphShown: boolean = false;
  currentChartIndex: number = 0;
  height: number = 500;
  width: number = 600;

  constructor(private readonly searchService: SearchArtistService) {}

  ngOnInit() {
    console.log('filters', this.filters);
    this.searchService
      .getSummarize(
        this.filters.genre,
        this.filters.country,
        this.filters.fromYear,
        this.filters.toYear
      )
      .subscribe(
        (response: ResponseSummarizeModel) => {
          this.data = response;
          if (this.data) {
            this.isGraphShown = true;
          }
          console.log(response);
        },
        (error) => console.error('Error getting summarize data.')
      );
  }

  nextChart() {
    this.currentChartIndex++;
    if (this.currentChartIndex > 2) {
      this.currentChartIndex = this.currentChartIndex % 3;
    }
  }
}
