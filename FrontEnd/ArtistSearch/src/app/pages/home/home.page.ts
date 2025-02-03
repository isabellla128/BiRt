import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [IonContent, RouterModule],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  constructor(private router: Router) {}
}
