import { GenreShortModel } from './genreShort.model';

export interface ArtistModel {
  id: string;
  name: string;
  birth?: string | null;
  death?: string | null;
  photo?: string | null;
  country: string;
  occupations: string[];
  genres: GenreShortModel[];
  awards: string[];
  nominations: string[];
  instruments: string[];
}
