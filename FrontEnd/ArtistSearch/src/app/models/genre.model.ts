import { GenreShortModel } from './genreShort.model';

export interface GenreModel {
  id: string;
  label: string;
  image: string;
  wikipediaLink: string;
  description: string;
  subgenres: GenreShortModel[];
  countries: GenreShortModel[];
  parentCategories: GenreShortModel[];
  superclasses: GenreShortModel[];
}
