import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';

  onLogin() {
    if (this.username === 'admin' && this.password === '1234') {
      alert('✅ Login successful!');
    } else {
      alert('❌ Invalid credentials');
    }
  }
}
