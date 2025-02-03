import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { MenuPage } from './pages/menu/menu.page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonicModule, MenuPage],
  templateUrl: 'app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  constructor() {}
}
