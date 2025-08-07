import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  uploadImage(
    presentationId: string,
    slideId: string,
    file: File,
    connectionId: string
  ): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = new HttpHeaders().set('X-Connection-ID', connectionId);

    const url = `${this.baseUrl}/${presentationId}/slides/${slideId}/upload-image`;
    return this.http.post<void>(url, formData, { headers });
  }
}
