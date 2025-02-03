import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  constructor(private http: HttpClient) {}

  getArtists(
    genre?: string,
    country?: string,
    from?: number,
    to?: number
  ): Observable<ResponseArtistSummaryModel> {
    const params = this.buildParams(genre, country, from, to);

    return this.http.get<ResponseArtistSummaryModel>(this.apiUrl, { params });
  }

  getSummarize(
    genre?: string,
    country?: string,
    from?: number,
    to?: number
  ): Observable<ResponseSummarizeModel> {
    let params = this.buildParams(genre, country, from, to);

    console.log('params', params);
    params = params.set('limit-countries', '30');
    params = params.set('limit-genres', '30');
    console.log('params', params);

    return this.http.get<ResponseSummarizeModel>(this.apiUrlForSummarize, {
      params,
    });
  }

  getArtistById(id: string): Observable<ArtistModel> {
    return this.http.get<ArtistModel>(`${this.apiUrl}/${id}`);
  }

  getArtistByIdExport(id: string): Observable<any> {
    const headers = new HttpHeaders().set('Accept', 'application/rdf+xml');

    return this.http.get<any>(`${this.apiUrl}/${id}`, {
      headers,
      responseType: 'blob' as 'json',
    });
  }

  getArtistByIdRecommend(id: string): Observable<ResponseArtistSummaryModel> {
    return this.http.get<ResponseArtistSummaryModel>(
      `${this.apiUrl}/${id}/recommend`
    );
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
