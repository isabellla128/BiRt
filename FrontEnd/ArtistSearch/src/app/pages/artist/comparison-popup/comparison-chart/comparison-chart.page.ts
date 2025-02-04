import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { NgxSpinnerModule } from 'ngx-spinner';
import { forkJoin } from 'rxjs';
import { BarChartComponent } from '../../../../components/bar-chart/bar-chart.component';
import { ArtistModel } from '../../../../models/artist.model';
import { SearchArtistService } from '../../../../services/searchArtist.service';

@Component({
  selector: 'app-comparison-chart',
  standalone: true,
  imports: [CommonModule, BarChartComponent, NgxSpinnerModule],
  templateUrl: './comparison-chart.page.html',
  styleUrls: ['./comparison-chart.page.scss'],
  providers: [SearchArtistService],
})
export class ComparisonChartComponent implements OnInit {
  @Input() artistId1: string | undefined;
  @Input() artistId2: string | undefined;

  artist1!: ArtistModel;
  artist2!: ArtistModel;
  isGraphShown: boolean = false;
  isSmallScreen: boolean = false;
  width: number = 600;
  height: number = 500;

  constructor(private readonly searchService: SearchArtistService) {}

  ngOnInit(): void {
    this.isSmallScreen = window.innerWidth <= 768;
    if (this.isSmallScreen) {
      this.width = 300;
      this.height = 500;
    }
    if (this.artistId1 && this.artistId2) {
      forkJoin([
        this.searchService.getArtistById(this.artistId1),
        this.searchService.getArtistById(this.artistId2),
      ]).subscribe(([artist1, artist2]) => {
        this.artist1 = artist1;
        this.artist2 = artist2;

        if (this.artist1 && this.artist2 && !this.isGraphShown) {
          this.isGraphShown = true;
        }
      });
    }
  }
}
