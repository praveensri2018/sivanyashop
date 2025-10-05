// Place file at: src/app/retailer/retailer-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, UserPayload } from '../auth/auth.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-retailer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './retailer-dashboard.component.html',
  styleUrls: ['./retailer-dashboard.component.scss']
})
export class RetailerDashboardComponent implements OnInit {
  user: UserPayload | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.user = this.auth.getUser();
  }
}
