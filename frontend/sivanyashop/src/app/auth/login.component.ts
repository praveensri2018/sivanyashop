import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // required for ngModel
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
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

    this.auth.login(this.email, this.password, this.remember).subscribe({
      next: (user) => {
        this.loading = false;
        const role = (user.role || '').toString().toUpperCase();
        if (role === 'ADMIN') this.router.navigate(['/admin']).catch(() => {});
        else if (role === 'RETAILER') this.router.navigate(['/retailer']).catch(() => {});
        else this.router.navigate(['/customer']).catch(() => {});
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Login failed';
      }
    });
  }

  goToRegister() {
  this.router.navigate(['/register']).catch(() => {});
}
}
