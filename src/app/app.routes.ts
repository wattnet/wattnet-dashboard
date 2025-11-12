import { Routes } from '@angular/router';
import { ContentLayoutComponent } from './layout/content-layout/content-layout.component';
import { AboutComponent } from './modules/about/about.component';
import { HomeComponent } from './modules/home/home.component';
export const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    children: [
      {
        path: '',
        component: HomeComponent,
        pathMatch: 'full',
      },
      { path: 'about', component: AboutComponent, pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' }, // Manejo de rutas no encontradas
];
