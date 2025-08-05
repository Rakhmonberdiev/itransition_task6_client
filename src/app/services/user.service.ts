import { computed, Injectable, signal } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private _user = signal<User | null>(null);

  constructor() {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        this._user.set(parsed);
      } catch {
        localStorage.removeItem('user');
      }
    }
  }
  readonly user = computed(() => this._user());

  setUser(user: User) {
    this._user.set(user);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearUser() {
    this._user.set(null);
    localStorage.removeItem('user');
  }

  isLoggedIn(): boolean {
    return this._user() !== null;
  }
}
