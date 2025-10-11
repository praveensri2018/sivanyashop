import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  loading = false;
  error: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = null;

    // basic validation
    if (!this.name.trim() || !this.email.trim() || !this.password.trim()) {
      this.error = 'All fields are required';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;

    this.auth.register(this.name.trim(), this.email.trim(), this.password)
      .subscribe({
        next: () => {
          this.loading = false;
          alert('✅ Account created successfully! Please login.');
          this.router.navigate(['/login']).catch(() => {});
        },
        error: (err) => {
          this.loading = false;
          this.error = err?.error?.message || err?.message || 'Registration failed';
        }
      });
  }

  goToLogin() {
    this.router.navigate(['/login']).catch(() => {});
  }
}
