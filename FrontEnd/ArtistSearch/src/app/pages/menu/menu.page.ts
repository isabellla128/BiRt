import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonHeader, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [IonHeader, IonToolbar, CommonModule, RouterModule],
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
})
export class MenuPage {
  constructor() {}

  isMenuOpen = false;

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}
