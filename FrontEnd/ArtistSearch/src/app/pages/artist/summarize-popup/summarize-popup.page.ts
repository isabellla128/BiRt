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

  constructor(private readonly searchService: SearchArtistService) {
    // this.data = {
    //   byCountry: [
    //     { country: 'united states', count: 16192 },
    //     { country: 'japan', count: 6509 },
    //     { country: 'united kingdom', count: 4144 },
    //     { country: 'south korea', count: 3554 },
    //     { country: 'france', count: 3467 },
    //     { country: 'germany', count: 3365 },
    //     { country: 'sweden', count: 2553 },
    //     { country: 'italy', count: 2502 },
    //     { country: 'canada', count: 2489 },
    //     { country: 'spain', count: 2426 },
    //     { country: 'kingdom of the netherlands', count: 2282 },
    //     { country: 'india', count: 1981 },
    //     { country: 'brazil', count: 1967 },
    //     { country: 'soviet union', count: 1938 },
    //     { country: 'russia', count: 1873 },
    //     { country: 'finland', count: 1698 },
    //     { country: 'norway', count: 1693 },
    //     { country: 'israel', count: 1393 },
    //     { country: 'argentina', count: 1373 },
    //     { country: 'indonesia', count: 1345 },
    //     { country: "people's republic of china", count: 1256 },
    //     { country: 'australia', count: 1166 },
    //     { country: 'belgium', count: 1161 },
    //     { country: 'kingdom of denmark', count: 1058 },
    //     { country: 'greece', count: 1026 },
    //     { country: 'mexico', count: 961 },
    //     { country: 'austria', count: 837 },
    //     { country: 'switzerland', count: 832 },
    //     { country: 'taiwan', count: 831 },
    //     { country: 'turkey', count: 815 },
    //   ],
    //   byDecade: [
    //     { decade: '1990-1999', count: 11625 },
    //     { decade: '2000-2009', count: 3865 },
    //     { decade: '2010-2019', count: 135 },
    //     { decade: '2020-2025', count: 1 },
    //   ],
    //   byGenre: [
    //     { genre: 'pop music', count: 9852 },
    //     { genre: 'rock music', count: 3092 },
    //     { genre: 'hip-hop', count: 1898 },
    //     { genre: 'jazz', count: 1875 },
    //     { genre: 'country music', count: 1834 },
    //     { genre: 'j-pop', count: 1681 },
    //     { genre: 'soul', count: 1307 },
    //     { genre: 'rhythm and blues', count: 1181 },
    //     { genre: 'contemporary r&b', count: 1055 },
    //     { genre: 'k-pop', count: 1031 },
    //     { genre: 'pop rock', count: 953 },
    //     { genre: 'alternative rock', count: 927 },
    //     { genre: 'traditional folk music', count: 884 },
    //     { genre: 'blues', count: 870 },
    //     { genre: 'folk music', count: 693 },
    //     { genre: 'reggae', count: 591 },
    //     { genre: 'indie rock', count: 470 },
    //     { genre: 'opera', count: 450 },
    //     { genre: 'trot', count: 400 },
    //     { genre: 'hard rock', count: 394 },
    //     { genre: 'classical music', count: 380 },
    //     { genre: 'electronic music', count: 379 },
    //     { genre: 'rapping', count: 379 },
    //     { genre: 'chanson', count: 366 },
    //     { genre: 'punk rock', count: 363 },
    //     { genre: 'folk rock', count: 359 },
    //     { genre: 'gospel music', count: 355 },
    //     { genre: 'indie pop', count: 350 },
    //     { genre: 'heavy metal', count: 335 },
    //     { genre: 'dance music', count: 333 },
    //   ],
    // };

    this.searchService
      .getSummarize(
        this.filters?.genre ?? undefined,
        this.filters?.country ?? undefined,
        this.filters?.fromYear ?? undefined,
        this.filters?.toYear ?? undefined
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
