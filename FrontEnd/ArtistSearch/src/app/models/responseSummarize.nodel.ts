export interface ResponseSummarizeModel {
  byCountry: ByCountryResponseModel[];
  byDecade: ByDecadeResponseModel[];
  byGenre: ByGenreResponseModel[];
}

export interface ByCountryResponseModel {
  country: string;
  count: number;
}

export interface ByGenreResponseModel {
  genre: string;
  count: number;
}

export interface ByDecadeResponseModel {
  decade: string;
  count: number;
}
