// PLACE IN: src/app/auth/login.component.ts
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ add this import
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  // ✅ include FormsModule so [(ngModel)] works
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  remember = false;
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading = true;
    this.error = null;

    this.auth.login(this.email, this.password).subscribe({
      next: (resp) => {
        console.log(resp);
        this.loading = false;
        const role = (resp.role || '').toString().toUpperCase();
        if (role === 'ADMIN') this.router.navigate(['/admin']);
        else if (role === 'RETAILER') this.router.navigate(['/retailer']);
        else this.router.navigate(['/customer']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed';
      }
    });
  }
}
