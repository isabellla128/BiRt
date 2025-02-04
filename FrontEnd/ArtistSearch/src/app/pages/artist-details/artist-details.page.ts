import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { ToastrModule, ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ArtistSummaryModel } from '../../models';
import { ArtistModel } from '../../models/artist.model';
import { ResponseArtistSummaryModel } from '../../models/responseArtistSummary.model';
import { SearchArtistService } from '../../services/searchArtist.service';

@Component({
  selector: 'app-artists-details',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    ToastrModule,
  ],
  templateUrl: './artist-details.page.html',
  styleUrls: ['./artist-details.page.scss'],
  providers: [SearchArtistService],
})
export class ArtistDetailsPage {
  artist: ArtistModel | undefined;

  isSmallScreen: boolean = false;
  recommendations: ArtistSummaryModel[] = [];
  middleIndex: number = 1;
  recommendationsDisplayed: (ArtistSummaryModel | null)[] = [];
  subscriptions: Subscription[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly searchArtistService: SearchArtistService,
    private readonly toastrService: ToastrService
  ) {
    this.isSmallScreen = window.innerWidth <= 1024;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const artistId = params.get('id')!;
      this.getArtistDetails(artistId);
    });
  }

  onExport() {
    this.searchArtistService
      .getArtistByIdExport(this.artist!.id)
      .subscribe((data: any) => {
        console.log(data);
        this.downloadFile(
          data,
          `artist_${this.artist!.id}.xml`,
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

  private getArtistDetails(artistId: string): void {
    this.subscriptions.push(
      this.searchArtistService.getArtistById(artistId).subscribe(
        (response: ArtistModel) => {
          this.artist = response;
          this.getArtistRecommendations(artistId);
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

  private getArtistRecommendations(artistId: string): void {
    this.subscriptions.push(
      this.searchArtistService.getArtistByIdRecommend(artistId).subscribe(
        (response: ResponseArtistSummaryModel) => {
          this.recommendations = response.artists;
          console.log(response.artists);
          this.updateDisplayedRecommendations();
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

  getArtistPhoto(artist: ArtistModel | ArtistSummaryModel): string {
    return artist.photo !== null &&
      artist.photo !== undefined &&
      artist.photo !== ''
      ? artist.photo
      : 'assets/images/artist_no_image.png';
  }

  updateDisplayedRecommendations(): void {
    if (!this.isSmallScreen) {
      this.recommendationsDisplayed = [
        this.recommendations[this.middleIndex - 1],
        this.recommendations[this.middleIndex],
        this.recommendations[this.middleIndex + 1],
      ];
    } else {
      if (this.middleIndex === 0) {
        this.recommendationsDisplayed = [
          null,
          this.recommendations[this.middleIndex],
          this.recommendations[this.middleIndex + 1],
        ] as unknown as ArtistSummaryModel[];
      } else if (this.middleIndex === this.recommendations.length - 1) {
        this.recommendationsDisplayed = [
          this.recommendations[this.middleIndex - 1],
          this.recommendations[this.middleIndex],
          null,
        ] as unknown as ArtistSummaryModel[];
      } else {
        this.recommendationsDisplayed = [
          this.recommendations[this.middleIndex - 1],
          this.recommendations[this.middleIndex],
          this.recommendations[this.middleIndex + 1],
        ];
      }
    }
  }

  shiftRecommendations(direction: number): void {
    const newMiddleIndex = this.middleIndex + direction;
    if (!this.isSmallScreen) {
      if (
        newMiddleIndex >= 0 &&
        newMiddleIndex <= this.recommendations.length - 1
      ) {
        this.middleIndex = newMiddleIndex;
        if (
          newMiddleIndex > 0 &&
          newMiddleIndex < this.recommendations.length - 1
        ) {
          this.updateDisplayedRecommendations();
        }
      }
    } else {
      if (
        newMiddleIndex >= 0 &&
        newMiddleIndex <= this.recommendations.length - 1
      ) {
        this.middleIndex = newMiddleIndex;
        this.updateDisplayedRecommendations();
      }
    }
  }

  getClass(index: number): string {
    if (this.isSmallScreen) {
      if (index === 1) return 'large';
      else return 'small';
    } else {
      switch (this.middleIndex) {
        case 0:
          if (index === 0) return 'large';
          else return 'small';
        case this.recommendations.length - 1:
          if (index === 2) return 'large';
          else return 'small';
        default:
          if (index === 1) return 'large';
          else return 'small';
      }
    }
  }

  isLeftDisabled(): boolean {
    return this.middleIndex === 0;
  }

  isRightDisabled(): boolean {
    return this.middleIndex === this.recommendations.length - 1;
  }
}
