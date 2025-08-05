import { Component, inject, OnInit, signal } from '@angular/core';
import { Presentation } from '../../models/presentation.model';
import { PresentationService } from '../../services/presentation.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-presentations',
  imports: [],
  templateUrl: './presentations.html',
  styleUrl: './presentations.css',
})
export class Presentations implements OnInit {
  presentations = signal<Presentation[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  private presentationService = inject(PresentationService);
  private router = inject(Router);
  userService = inject(UserService);
  ngOnInit(): void {
    this.loadData();
  }
  join(presentationId: string) {
    this.router.navigate(['/room', presentationId]);
  }
  createPresentation() {
    console.log(' create a new presentation');
  }
  logout() {
    this.userService.clearUser();
    this.router.navigate(['/login']);
  }
  private loadData() {
    this.presentationService.getAll().subscribe({
      next: (data) => {
        this.presentations.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error when enabling presentations');
        this.loading.set(false);
      },
    });
  }
}
