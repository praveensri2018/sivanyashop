import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
    constructor(private router: Router) {}
  username = '';
  password = '';

  onLogin() {
    if (this.username === 'admin' && this.password === '1234') {
        this.router.navigate(['/dashboard']); 
      alert('✅ Login successful!');
    } else {
      alert('❌ Invalid credentials');
    }
  }
}
