// src/app/ui/footer.component.ts
// Place file at: src/app/ui/footer.component.ts

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer class="bg-white border-top mt-5">
      <div class="container py-4 text-center text-muted small">
        © {{ year }} Sivanuya Trends Tops — curated fashion for everyone.
      </div>
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
}
