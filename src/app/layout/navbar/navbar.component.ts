import { Component } from '@angular/core';
import { Menubar } from 'primeng/menubar';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Menubar],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  items = [
    {
      label: 'Explore',
      routerLink: '/explore',
    },
    {
      label: 'Documentation',
      routerLink: '/documentation',
    },
    {
      label: 'API',
      routerLink: '/api',
    },
    {
      label: 'About',
      routerLink: '/about',
    },
  ];
}
