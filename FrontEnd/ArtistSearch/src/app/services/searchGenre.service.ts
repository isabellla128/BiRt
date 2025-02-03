import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GenreModel } from '../models/genre.model';
import { ResponseArtistSummaryModel } from '../models/responseArtistSummary.model';
import { ResponseGenreSummaryModel } from '../models/responseGenreSummary.model';

@Injectable({
  providedIn: 'root',
})
export class SearchGenreService {
  private apiUrl = 'http://web-project.eu-north-1.elasticbeanstalk.com/genres';

  constructor(private http: HttpClient) {}

  getGenres(
    country?: string,
    from?: number,
    to?: number
  ): Observable<ResponseGenreSummaryModel> {
    const params = this.buildParams(country, from, to);

    return this.http.get<ResponseGenreSummaryModel>(this.apiUrl, { params });
  }

  getGenreById(id: string): Observable<GenreModel> {
    return this.http.get<GenreModel>(`${this.apiUrl}/${id}`);
  }

  getArtistByIdExport(id: string): Observable<any> {
    const headers = new HttpHeaders().set('Accept', 'application/rdf+xml');

    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers,
      responseType: 'blob' as 'json',
    });
  }

  getGenreByIdRecommendForGenre(
    id: string
  ): Observable<ResponseGenreSummaryModel> {
    return this.http.get<ResponseGenreSummaryModel>(
      `${this.apiUrl}/${id}/recommendGenres`
    );
  }

  getGenreByIdRecommendForArtist(
    id: string
  ): Observable<ResponseArtistSummaryModel> {
    return this.http.get<ResponseArtistSummaryModel>(
      `${this.apiUrl}/${id}/recommendArtists`
    );
  }

  private buildParams(
    country?: string,
    from?: number,
    to?: number
  ): HttpParams {
    let params = new HttpParams();

    if (country !== undefined && country !== null && country !== '') {
      params = params.set('country', country);
    }

    if (from !== undefined && from !== null) {
      if (to !== undefined && to !== null)
        params = params.set('from-to', `${from}-${to}`);
      else params = params.set('from-to', `${from}-2023`);
    } else {
      if (to !== undefined && to !== null)
        params = params.set('from-to', `1990-${to}`);
    }

    return params;
  }
}
