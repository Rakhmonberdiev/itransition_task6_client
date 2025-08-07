import { Component, inject, OnInit, signal } from '@angular/core';
import { Presentation } from '../../models/presentation.model';
import { PresentationService } from '../../services/presentation.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-presentations',
  imports: [FormsModule],
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
  creating = signal(false);
  newTitle = signal('');
  ngOnInit(): void {
    this.loadData();
  }
  join(presentationId: string) {
    this.router.navigate(['/room', presentationId]);
  }

  startCreate() {
    this.newTitle.set('');
    this.creating.set(true);
  }
  cancelCreate() {
    this.newTitle.set('');
    this.creating.set(false);
  }
  submitCreate() {
    const title = this.newTitle().trim();
    if (!title) return;
    this.loading.set(true);

    const creatorName = this.userService.user()?.name ?? 'anonymous';
    this.presentationService.createPresentation(title, creatorName).subscribe({
      next: ({ id }) => this.router.navigate(['/room', id]),
      error: () => {
        this.error.set('Failed to create presentation');
        this.loading.set(false);
      },
    });

    this.creating.set(false);
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
