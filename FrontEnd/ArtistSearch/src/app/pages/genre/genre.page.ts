import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { GenreSummaryModel } from '../../models/genreSummary.model';
import { ResponseGenreSummaryModel } from '../../models/responseGenreSummary.model';
import { SearchGenreService } from '../../services/searchGenre.service';
import { GenreForm } from './genre.form';

@Component({
  selector: 'app-general',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './genre.page.html',
  styleUrls: ['./genre.page.scss', '../artist/artist.page.scss'],
})
export class GenrePage {
  genreForm: GenreForm = new GenreForm();
  genres: GenreSummaryModel[] = [];

  subscriptions: Subscription[] = [];

  constructor(private readonly searchGenreService: SearchGenreService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.searchGenreService.getGenres().subscribe(
        (response: ResponseGenreSummaryModel) => {
          console.log(response);
          this.genres = response.genres;
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
  getGenreImage(genre: GenreSummaryModel): string {
    return genre.image !== null &&
      genre.image !== undefined &&
      genre.image !== '' &&
      genre.image.slice(-3).toLowerCase() !== 'pdf'
      ? genre.image
      : 'assets/images/genre_no_image.png';
  }

  onSearch() {
    if (this.genreForm.valid) {
      const { country, fromYear, toYear } = this.genreForm.value;

      console.log('Searching for:', country, fromYear, toYear);
      this.subscriptions.push;
      this.searchGenreService.getGenres(country, fromYear, toYear).subscribe(
        (response: ResponseGenreSummaryModel) => {
          console.log(response);
          this.genres = response.genres;
        },
        (error) => {
          // this.toastrService.error(
          //   'An error occurred while searching for artists.',
          //   '',
          //   {
          //     positionClass: 'toast-bottom-center', // Set the position locally
          //   }
          // );
        }
      );
    }
  }
}
