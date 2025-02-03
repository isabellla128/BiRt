import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'artists',
    loadComponent: () =>
      import('./pages/artist/artist.page').then((m) => m.ArtistPage),
  },
  {
    path: 'genres',
    loadComponent: () =>
      import('./pages/genre/genre.page').then((m) => m.GenrePage),
  },
  {
    path: 'graphs',
    loadComponent: () =>
      import('./pages/graph/graph.page').then((m) => m.GraphPage),
  },
  {
    path: 'artists/:id',
    loadComponent: () =>
      import('./pages/artist-details/artist-details.page').then(
        (m) => m.ArtistDetailsPage
      ),
  },
  {
    path: 'genres/:id',
    loadComponent: () =>
      import('./pages/genre-details/genre-details.page').then(
        (m) => m.GenreDetailsPage
      ),
  },
];
