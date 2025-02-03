import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ArtistSummaryModel } from '../../models/artistSummary.model';
import { FilterModel } from '../../models/filter.model';
import { ResponseArtistSummaryModel } from '../../models/responseArtistSummary.model';
import { SearchArtistService } from '../../services/searchArtist.service';
import { SearchForm } from './artist.form';
import { ComparisonPopupComponent } from './comparison-popup/comparison-popup.page';
import { SummarizePopupComponent } from './summarize-popup/summarize-popup.page';
import { VisualizePopupComponent } from './visualize-popup/visualize-popup.page';

@Component({
  selector: 'app-artist',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    ComparisonPopupComponent,
    VisualizePopupComponent,
    ToastrModule,
    SummarizePopupComponent,
  ],
  templateUrl: './artist.page.html',
  styleUrls: ['./artist.page.scss'],
  providers: [SearchArtistService],
})
export class ArtistPage implements OnInit, OnDestroy {
  searchForm: SearchForm = new SearchForm();
  artists: ArtistSummaryModel[] = [];
  filters: FilterModel | undefined;
  selectedArtists: ArtistSummaryModel[] = [];
  isComparing = false;

  showComparisonPopup = false;
  showVisualizePopup = false;
  showSummarizePopup = false;

  selectedYearRange = {
    start: 1990,
    end: 2023,
  };

  subscriptions: Subscription[] = [];

  constructor(
    private readonly searchService: SearchArtistService,
    private toastrService: ToastrService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.searchService.getArtists().subscribe(
        (response: ResponseArtistSummaryModel) => {
          console.log(response);
          this.artists = response.artists;
        },
        (error) => {
          console.error('Error fetching artists:', error);
        }
      )
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getArtistPhoto(artist: ArtistSummaryModel): string {
    return artist.photo !== null &&
      artist.photo !== undefined &&
      artist.photo !== ''
      ? artist.photo
      : 'assets/images/artist_no_image.png';
  }

  onCompare() {
    this.isComparing = true;
  }

  onDiscard() {
    this.selectedArtists = [];
    this.isComparing = false;
  }

  toggleSelection(artist: ArtistSummaryModel) {
    if (this.isComparing) {
      const index = this.selectedArtists.indexOf(artist);
      if (index > -1) {
        this.selectedArtists.splice(index, 1);
      } else if (this.selectedArtists.length < 2) {
        this.selectedArtists.push(artist);
      }
    }
  }

  isSelected(artist: ArtistSummaryModel): boolean {
    return this.selectedArtists.includes(artist);
  }

  compareArtists() {
    if (this.selectedArtists.length === 2) {
      this.showComparisonPopup = true;
    }
  }

  discardComparison() {
    this.selectedArtists = [];
    this.isComparing = false;
    this.showComparisonPopup = false;
  }

  discardVisualize() {
    this.showVisualizePopup = false;
  }

  discardSummarized() {
    this.showSummarizePopup = false;
  }

  onVisualize() {
    this.showVisualizePopup = true;
  }

  onSummarize() {
    this.showSummarizePopup = true;
  }

  onSearch() {
    if (this.searchForm.valid) {
      const { genre, country, fromYear, toYear } = this.searchForm.value;

      console.log('Searching for:', genre, country, fromYear, toYear);
      this.subscriptions.push(
        this.searchService
          .getArtists(genre, country, fromYear, toYear)
          .subscribe(
            (response: ResponseArtistSummaryModel) => {
              console.log(response);
              this.artists = response.artists;
            },
            (error) => {
              this.toastrService.error(
                'An error occurred while searching for artists.',
                '',
                {
                  positionClass: 'toast-bottom-center', // Set the position locally
                }
              );
            }
          )
      );
    }
  }
}
