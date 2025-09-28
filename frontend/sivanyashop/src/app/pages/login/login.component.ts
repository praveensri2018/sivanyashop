// -> Place this exact file at: src/app/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword = false;
  loading = false;
  error: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(5)]],
      remember: [false]
    });
  }

  onSubmit() {
    this.error = null;
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password } = this.loginForm.value;
    this.loading = true;
 // -> Place this exact snippet inside: src/app/login/login.component.ts
this.auth.login(email, password).subscribe({
  next: (res: any) => {
    this.loading = false;
    if (res && res.token) {
      // token already saved by AuthService.tap() — now navigate
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Login succeeded but no token returned.';
      console.warn('Login response:', res);
    }
  },
  error: (err: any) => {
    this.loading = false;
    console.error('Login error', err);
    this.error = err?.error?.message || 'Login failed. Check credentials and backend.';
  }
});


  }

  get email() { return this.loginForm.get('email'); }
  get password() { return this.loginForm.get('password'); }
}
