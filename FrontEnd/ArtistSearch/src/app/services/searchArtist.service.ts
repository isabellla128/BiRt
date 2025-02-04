import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ArtistModel } from '../models/artist.model';
import { ResponseArtistSummaryModel } from '../models/responseArtistSummary.model';
import { ResponseSummarizeModel } from '../models/responseSummarize.nodel';

@Injectable({
  providedIn: 'root',
})
export class SearchArtistService {
  private apiUrl = 'http://web-project.eu-north-1.elasticbeanstalk.com/artists';
  private apiUrlForSummarize =
    'https://gu6x32j3ercvacbilhkutwjmma0ilnpa.lambda-url.eu-north-1.on.aws';
  private CACHE_EXPIRATION_MS = 24 * 60 * 60 * 1000;

  constructor(private http: HttpClient) {
    this.clearExpiredCache();
    setInterval(() => this.clearExpiredCache(), 60 * 60 * 1000);
  }

  private setCache(key: string, data: any): void {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(cacheEntry));
  }

  private getCache(key: string): any | null {
    const cachedData = sessionStorage.getItem(key);

    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      if (Date.now() - parsedData.timestamp < this.CACHE_EXPIRATION_MS) {
        return parsedData.data;
      } else {
        sessionStorage.removeItem(key);
      }
    }
    return null;
  }

  getArtists(
    genre?: string,
    country?: string,
    from?: number,
    to?: number
  ): Observable<ResponseArtistSummaryModel> {
    const params = this.buildParams(genre, country, from, to);
    const cacheKey = this.generateCacheKey(
      genre,
      country,
      from?.toString(),
      to?.toString()
    );

    const cachedData = this.getCache(cacheKey);
    if (cachedData) {
      console.log('Loaded artists from cache.');
      return of(cachedData);
    }

    return this.http
      .get<ResponseArtistSummaryModel>(this.apiUrl, { params })
      .pipe(
        tap((response) => {
          this.setCache(cacheKey, response);
          console.log('Fetched artists from API and cached.');
        })
      );
  }

  getSummarize(
    genre?: string,
    country?: string,
    from?: number,
    to?: number
  ): Observable<ResponseSummarizeModel> {
    let params = this.buildParams(genre, country, from, to);
    params = params.set('limit-countries', '30');
    params = params.set('limit-genres', '30');

    const cacheKey = this.generateSummarizeCacheKey(
      genre,
      country,
      from?.toString(),
      to?.toString()
    );
    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      console.log('Loaded summarize data from cache.');
      return of(cachedData);
    }

    return this.http
      .get<ResponseSummarizeModel>(this.apiUrlForSummarize, { params })
      .pipe(
        tap((response) => {
          this.setCache(cacheKey, response);
          console.log('Fetched summarize data from API and cached.');
        })
      );
  }

  getArtistById(id: string): Observable<ArtistModel> {
    const cacheKey = this.generateArtistByIdCacheKey(id);
    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      console.log(`Loaded artist ${id} from cache.`);
      return of(cachedData);
    }

    return this.http.get<ArtistModel>(`${this.apiUrl}/${id}`).pipe(
      tap((response) => {
        this.setCache(cacheKey, response);
        console.log(`Fetched artist ${id} from API and cached.`);
      })
    );
  }

  getArtistByIdExport(id: string): Observable<any> {
    const headers = new HttpHeaders().set('Accept', 'application/rdf+xml');
    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers,
      responseType: 'blob' as 'json',
    });
  }

  getArtistByIdRecommend(id: string): Observable<ResponseArtistSummaryModel> {
    const cacheKey = this.generateArtistRecommendCacheKey(id);
    const cachedData = this.getCache(cacheKey);

    if (cachedData) {
      console.log(`Loaded recommendations for artist ${id} from cache.`);
      return of(cachedData);
    }

    return this.http
      .get<ResponseArtistSummaryModel>(`${this.apiUrl}/${id}/recommend`)
      .pipe(
        tap((response) => {
          this.setCache(cacheKey, response);
          console.log(
            `Fetched recommendations for artist ${id} from API and cached.`
          );
        })
      );
  }

  clearExpiredCache(): void {
    const now = Date.now();
    Object.keys(sessionStorage).forEach((key) => {
      const cachedItem = sessionStorage.getItem(key);
      if (cachedItem) {
        try {
          const parsedItem = JSON.parse(cachedItem);
          if (
            parsedItem.timestamp &&
            now - parsedItem.timestamp >= this.CACHE_EXPIRATION_MS
          ) {
            sessionStorage.removeItem(key);
            console.log(`Cache cleared for key: ${key}`);
          }
        } catch (error) {
          console.warn(`Invalid cache entry for key: ${key}`);
        }
      }
    });
  }

  private generateCacheKey(
    genre?: string,
    country?: string,
    from?: string,
    to?: string
  ): string {
    return `cachedArtists_${genre?.toLowerCase() || 'all'}_${
      country?.toLowerCase() || 'all'
    }_${from || 'start'}_${to || 'end'}`;
  }

  private generateSummarizeCacheKey(
    genre?: string,
    country?: string,
    from?: string,
    to?: string
  ): string {
    return `cachedSummarize_${genre?.toLowerCase() || 'all'}_${
      country?.toLowerCase() || 'all'
    }_${from || 'start'}_${to || 'end'}`;
  }

  private generateArtistByIdCacheKey(id: string): string {
    return `cachedArtist_${id}`;
  }

  private generateArtistRecommendCacheKey(id: string): string {
    return `cachedArtistRecommend_${id}`;
  }

  private buildParams(
    genre?: string,
    country?: string,
    from?: number,
    to?: number
  ): HttpParams {
    let params = new HttpParams();

    if (genre !== undefined && genre !== null && genre !== '') {
      params = params.set('genre', genre);
    }

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
