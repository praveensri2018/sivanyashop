// src/app/app.component.ts
// Root standalone AppComponent (uses external HTML & SCSS files you wanted to keep)

import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './ui/header.component'; // <-- place file: src/app/ui/header.component.ts
import { FooterComponent } from './ui/footer.component'; // <-- place file: src/app/ui/footer.component.ts
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.component.html',     // <-- keep HTML filename
  styleUrls: ['./app.component.scss']      // <-- keep SCSS filename (note the plural)
})
export class AppComponent {
  title = 'Sivanuya Trends Tops';
}
