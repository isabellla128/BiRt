import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ArtistSummaryModel } from '../../models/artistSummary.model';
import { GenreModel } from '../../models/genre.model';
import { GenreSummaryModel } from '../../models/genreSummary.model';
import { ResponseArtistSummaryModel } from '../../models/responseArtistSummary.model';
import { ResponseGenreSummaryModel } from '../../models/responseGenreSummary.model';
import { SearchGenreService } from '../../services/searchGenre.service';

@Component({
  selector: 'app-general-details',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './genre-details.page.html',
  styleUrls: [
    './genre-details.page.scss',
    '../artist-details/artist-details.page.scss',
  ],
})
export class GenreDetailsPage {
  genre: GenreModel | undefined;
  isSmallScreen: boolean = false;

  recommendationsForGenre: GenreSummaryModel[] = [];
  recommendationsForArtist: ArtistSummaryModel[] = [];

  middleIndexForGenre: number = 1;
  middleIndexForArtist: number = 1;

  recommendationsDisplayedForGenre: (GenreSummaryModel | null)[] = [];
  recommendationsDisplayedForArtist: (ArtistSummaryModel | null)[] = [];

  subscriptions: Subscription[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly searchGenreService: SearchGenreService,
    private readonly toastrService: ToastrService
  ) {
    this.isSmallScreen = window.innerWidth <= 1024;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const genreId = params.get('id')!;
      this.getGenreDetails(genreId);
    });
  }

  onExport() {
    this.searchGenreService
      .getArtistByIdExport(this.genre!.id)
      .subscribe((data: any) => {
        console.log(data);
        this.downloadFile(
          data,
          `genre_${this.genre!.id}.xml`,
          'application/xml'
        );
      });
  }

  private downloadFile(data: any, filename: string, fileType: string) {
    const blob = new Blob([data], { type: fileType });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  getGenreImage(genre: GenreModel | GenreSummaryModel): string {
    return genre.image !== null &&
      genre.image !== undefined &&
      genre.image !== ''
      ? genre.image
      : 'assets/images/genre_no_image.png';
  }

  private getGenreDetails(genreId: string): void {
    this.subscriptions.push(
      this.searchGenreService.getGenreById(genreId).subscribe(
        (response: GenreModel) => {
          this.genre = response;
          this.getRecommendationsForGenre(genreId);
          this.getRecommendationsForArtist(genreId);
        },
        (error) => {
          this.toastrService.error(
            'An error occurred while fetching artist details.',
            'Error',
            {
              positionClass: 'toast-bottom-center',
            }
          );
        }
      )
    );
  }

  private getRecommendationsForGenre(genreId: string): void {
    this.subscriptions.push(
      this.searchGenreService.getGenreByIdRecommendForGenre(genreId).subscribe(
        (response: ResponseGenreSummaryModel) => {
          this.recommendationsForGenre = response.genres;
          this.updateDisplayedRecommendationsForGenre();
        },
        (error) => {
          this.toastrService.error(
            'An error occurred while fetching artist recommendations.',
            'Error',
            {
              positionClass: 'toast-bottom-center',
            }
          );
        }
      )
    );
  }

  private getRecommendationsForArtist(genreId: string): void {
    this.subscriptions.push(
      this.searchGenreService.getGenreByIdRecommendForArtist(genreId).subscribe(
        (response: ResponseArtistSummaryModel) => {
          this.recommendationsForArtist = response.artists;
          this.updateDisplayedRecommendationsForArtist();
        },
        (error) => {
          this.toastrService.error(
            'An error occurred while fetching artist recommendations.',
            'Error',
            {
              positionClass: 'toast-bottom-center',
            }
          );
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

  updateDisplayedRecommendationsForGenre(): void {
    if (!this.isSmallScreen) {
      this.recommendationsDisplayedForGenre = [
        this.recommendationsForGenre[this.middleIndexForGenre - 1],
        this.recommendationsForGenre[this.middleIndexForGenre],
        this.recommendationsForGenre[this.middleIndexForGenre + 1],
      ];
    } else {
      if (this.middleIndexForGenre === 0) {
        this.recommendationsDisplayedForGenre = [
          null,
          this.recommendationsForGenre[this.middleIndexForGenre],
          this.recommendationsForGenre[this.middleIndexForGenre + 1],
        ] as unknown as GenreSummaryModel[];
      } else if (
        this.middleIndexForGenre ===
        this.recommendationsForGenre.length - 1
      ) {
        this.recommendationsDisplayedForGenre = [
          this.recommendationsForGenre[this.middleIndexForGenre - 1],
          this.recommendationsForGenre[this.middleIndexForGenre],
          null,
        ] as unknown as GenreSummaryModel[];
      } else {
        this.recommendationsDisplayedForGenre = [
          this.recommendationsForGenre[this.middleIndexForGenre - 1],
          this.recommendationsForGenre[this.middleIndexForGenre],
          this.recommendationsForGenre[this.middleIndexForGenre + 1],
        ];
      }
    }
  }

  shiftRecommendationsForGenre(direction: number): void {
    const newMiddleIndex = this.middleIndexForGenre + direction;
    if (!this.isSmallScreen) {
      if (
        newMiddleIndex >= 0 &&
        newMiddleIndex <= this.recommendationsForGenre.length - 1
      ) {
        this.middleIndexForGenre = newMiddleIndex;
        if (
          newMiddleIndex > 0 &&
          newMiddleIndex < this.recommendationsForGenre.length - 1
        ) {
          this.updateDisplayedRecommendationsForGenre();
        }
      }
    } else {
      if (
        newMiddleIndex >= 0 &&
        newMiddleIndex <= this.recommendationsForGenre.length - 1
      ) {
        this.middleIndexForGenre = newMiddleIndex;
        this.updateDisplayedRecommendationsForGenre();
      }
    }
  }

  getClassForGenre(index: number): string {
    if (this.isSmallScreen) {
      if (index === 1) return 'large';
      else return 'small';
    } else {
      switch (this.middleIndexForGenre) {
        case 0:
          if (index === 0) return 'large';
          else return 'small';
        case this.recommendationsForGenre.length - 1:
          if (index === 2) return 'large';
          else return 'small';
        default:
          if (index === 1) return 'large';
          else return 'small';
      }
    }
  }

  isLeftDisabledForGenre(): boolean {
    return this.middleIndexForGenre === 0;
  }

  isRightDisabledForGenre(): boolean {
    return this.middleIndexForGenre === this.recommendationsForGenre.length - 1;
  }

  //--------------------------------------------------------------------------------

  updateDisplayedRecommendationsForArtist(): void {
    if (!this.isSmallScreen) {
      this.recommendationsDisplayedForArtist = [
        this.recommendationsForArtist[this.middleIndexForArtist - 1],
        this.recommendationsForArtist[this.middleIndexForArtist],
        this.recommendationsForArtist[this.middleIndexForArtist + 1],
      ];
    } else {
      if (this.middleIndexForArtist === 0) {
        this.recommendationsDisplayedForArtist = [
          null,
          this.recommendationsForArtist[this.middleIndexForArtist],
          this.recommendationsForArtist[this.middleIndexForArtist + 1],
        ] as unknown as ArtistSummaryModel[];
      } else if (
        this.middleIndexForArtist ===
        this.recommendationsForArtist.length - 1
      ) {
        this.recommendationsDisplayedForArtist = [
          this.recommendationsForArtist[this.middleIndexForArtist - 1],
          this.recommendationsForArtist[this.middleIndexForArtist],
          null,
        ] as unknown as ArtistSummaryModel[];
      } else {
        this.recommendationsDisplayedForArtist = [
          this.recommendationsForArtist[this.middleIndexForArtist - 1],
          this.recommendationsForArtist[this.middleIndexForArtist],
          this.recommendationsForArtist[this.middleIndexForArtist + 1],
        ];
      }
    }
  }

  shiftRecommendationsForArtist(direction: number): void {
    const newMiddleIndex = this.middleIndexForArtist + direction;
    if (!this.isSmallScreen) {
      if (
        newMiddleIndex >= 0 &&
        newMiddleIndex <= this.recommendationsForArtist.length - 1
      ) {
        this.middleIndexForArtist = newMiddleIndex;
        if (
          newMiddleIndex > 0 &&
          newMiddleIndex < this.recommendationsForArtist.length - 1
        ) {
          this.updateDisplayedRecommendationsForArtist();
        }
      }
    } else {
      if (
        newMiddleIndex >= 0 &&
        newMiddleIndex <= this.recommendationsForGenre.length - 1
      ) {
        this.middleIndexForArtist = newMiddleIndex;
        this.updateDisplayedRecommendationsForArtist();
      }
    }
  }

  getClassForArtist(index: number): string {
    if (this.isSmallScreen) {
      if (index === 1) return 'large';
      else return 'small';
    } else {
      switch (this.middleIndexForArtist) {
        case 0:
          if (index === 0) return 'large';
          else return 'small';
        case this.recommendationsForArtist.length - 1:
          if (index === 2) return 'large';
          else return 'small';
        default:
          if (index === 1) return 'large';
          else return 'small';
      }
    }
  }

  isLeftDisabledForArtist(): boolean {
    return this.middleIndexForArtist === 0;
  }

  isRightDisabledForArtist(): boolean {
    return (
      this.middleIndexForArtist === this.recommendationsForArtist.length - 1
    );
  }
}
