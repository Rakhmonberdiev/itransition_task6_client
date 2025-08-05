import { Component, inject, OnInit, signal } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  name = signal('');
  error = signal<string | null>(null);
  private userService = inject(UserService);
  private router = inject(Router);
  ngOnInit(): void {
    if (this.userService.isLoggedIn()) {
      this.router.navigateByUrl('/');
    }
  }
  login() {
    const value = this.name().trim();
    if (!value) {
      this.error.set('Enter your name');
      return;
    }

    const user: User = { name: value };
    this.userService.setUser(user);
    this.router.navigateByUrl('');
  }
}
