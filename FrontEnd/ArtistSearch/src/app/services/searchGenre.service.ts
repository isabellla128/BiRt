import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { GenreModel } from '../models/genre.model';
import { ResponseArtistSummaryModel } from '../models/responseArtistSummary.model';
import { ResponseGenreSummaryModel } from '../models/responseGenreSummary.model';

@Injectable({
  providedIn: 'root',
})
export class SearchGenreService {
  private apiUrl = 'http://web-project.eu-north-1.elasticbeanstalk.com/genres';
  private CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

  constructor(private http: HttpClient) {
    this.clearExpiredCache();
    setInterval(() => this.clearExpiredCache(), 60 * 60 * 1000);
  }

  private setCache(key: string, data: any) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(cacheEntry));
  }

  private getCache(key: string) {
    const cachedItem = sessionStorage.getItem(key);
    if (cachedItem) {
      const { data, timestamp } = JSON.parse(cachedItem);
      if (Date.now() - timestamp < this.CACHE_EXPIRATION_MS) {
        return data;
      } else {
        sessionStorage.removeItem(key);
      }
    }
    return null;
  }

  private clearExpiredCache() {
    const now = Date.now();
    Object.keys(sessionStorage).forEach((key) => {
      const cachedItem = sessionStorage.getItem(key);
      if (cachedItem) {
        const { timestamp } = JSON.parse(cachedItem);
        if (now - timestamp > this.CACHE_EXPIRATION_MS) {
          sessionStorage.removeItem(key);
        }
      }
    });
  }

  getGenres(
    country?: string,
    from?: number,
    to?: number
  ): Observable<ResponseGenreSummaryModel> {
    const params = this.buildParams(country, from, to);
    const cacheKey = `cachedGenres_${country?.toLowerCase() || 'all'}_${
      from || 'start'
    }_${to || 'end'}`;

    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      return of(cachedData);
    } else {
      return this.http
        .get<ResponseGenreSummaryModel>(this.apiUrl, { params })
        .pipe(
          tap((response) => {
            this.setCache(cacheKey, response);
          })
        );
    }
  }

  getGenreById(id: string): Observable<GenreModel> {
    const cacheKey = `cachedGenre_${id}`;

    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      return of(cachedData);
    } else {
      return this.http.get<GenreModel>(`${this.apiUrl}/${id}`).pipe(
        tap((response) => {
          this.setCache(cacheKey, response);
        })
      );
    }
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
    const cacheKey = `cachedGenreRecommend_${id}`;

    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      return of(cachedData);
    } else {
      return this.http
        .get<ResponseGenreSummaryModel>(`${this.apiUrl}/${id}/recommendGenres`)
        .pipe(
          tap((response) => {
            this.setCache(cacheKey, response);
          })
        );
    }
  }

  getGenreByIdRecommendForArtist(
    id: string
  ): Observable<ResponseArtistSummaryModel> {
    const cacheKey = `cachedGenreRecommendForArtist_${id}`;

    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      return of(cachedData);
    } else {
      return this.http
        .get<ResponseArtistSummaryModel>(
          `${this.apiUrl}/${id}/recommendArtists`
        )
        .pipe(
          tap((response) => {
            this.setCache(cacheKey, response);
          })
        );
    }
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
