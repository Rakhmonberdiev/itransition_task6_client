import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Presentation } from '../models/presentation.model';

@Injectable({
  providedIn: 'root',
})
export class PresentationService {
  private baseUrl = environment.apiUrl + 'api/presentations';
  private http = inject(HttpClient);
  getAll(): Observable<Presentation[]> {
    return this.http.get<Presentation[]>(this.baseUrl);
  }
  getById(id: string): Observable<Presentation> {
    return this.http.get<Presentation>(`${this.baseUrl}/${id}`);
  }
}
