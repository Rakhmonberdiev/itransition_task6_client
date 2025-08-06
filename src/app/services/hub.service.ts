import { inject, Injectable, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
} from '@microsoft/signalr';
import { environment } from '../../environments/environment';
import { UserService } from './user.service';
import {
  ImageBlock,
  Slide,
  SlideElement,
  TextBlock,
} from '../models/presentation.model';
import { firstValueFrom } from 'rxjs';
import { PresentationService } from './presentation.service';
type Role = 'creator' | 'editor' | 'viewer';
@Injectable({
  providedIn: 'root',
})
export class HubService {
  private hubConnection!: HubConnection;
  private userService = inject(UserService);
  private presentationService = inject(PresentationService);
  readonly slides = signal<Slide[]>([]);
  readonly elements = signal<Record<string, SlideElement[]>>({});
  readonly users = signal<{ name: string; role: Role }[]>([]);
  readonly currentRole = signal<Role>('viewer');
  readonly isConnected = signal(false);

  async connect(presentationId: string): Promise<void> {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      await this.hubConnection.stop();
    }
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}hubs/presentation`)
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on(
      'InitialUsers',
      (list: { name: string; role: Role }[]) => {
        this.users.set(list);
        const me = this.userService.user()?.name;
        const meInfo = list.find((u) => u.name === me);
        if (meInfo) {
          this.currentRole.set(meInfo.role);
        }
      }
    );

    this.hubConnection.on('UserJoined', (name: string, role: Role) => {
      this.users.update((u) => [...u, { name, role }]);
    });

    this.hubConnection.on('UserLeft', (name: string) => {
      this.users.update((u) => u.filter((x) => x.name !== name));
    });

    this.hubConnection.on('UserRoleUpdated', (name: string, newRole: Role) => {
      this.users.update((u) =>
        u.map((x) => (x.name === name ? { ...x, role: newRole } : x))
      );
      if (name === this.userService.user()?.name) {
        this.currentRole.set(newRole);
      }
    });

    this.hubConnection.on('RoleChanged', (role: Role) => {
      this.currentRole.set(role);
    });

    this.hubConnection.on('SlideAdded', (slide: Slide) => {
      this.slides.update((s) => [...s, slide]);
      // Для нового слайда создаём пустой массив элементов
      this.elements.update((e) => ({ ...e, [slide.id]: [] }));
    });

    this.hubConnection.on(
      'ElementAdded',
      (slideId: string, el: SlideElement) => {
        this.elements.update((e) => {
          const copy = { ...e };
          copy[slideId] = [...(copy[slideId] ?? []), el];
          return copy;
        });
      }
    );

    this.hubConnection.on(
      'ElementUpdated',
      (slideId: string, el: SlideElement) => {
        this.elements.update((e) => {
          const copy = { ...e };
          copy[slideId] = copy[slideId].map((x) => (x.id === el.id ? el : x));
          return copy;
        });
      }
    );

    this.hubConnection.on(
      'ElementRemoved',
      (slideId: string, elementId: string) => {
        this.elements.update((e) => {
          const copy = { ...e };
          copy[slideId] = copy[slideId].filter((x) => x.id !== elementId);
          return copy;
        });
      }
    );

    await this.hubConnection.start();
    this.isConnected.set(true);

    const userName = this.userService.user()?.name ?? 'anonymous';
    await this.hubConnection.invoke(
      'JoinPresentation',
      presentationId,
      userName
    );

    const pres = await firstValueFrom(
      this.presentationService.getById(presentationId)
    );
    this.slides.set(pres.slides);
    this.elements.set(
      pres.slides.reduce(
        (acc, s) => ({ ...acc, [s.id]: s.elements ?? [] }),
        {} as Record<string, SlideElement[]>
      )
    );
  }

  disconnect(): void {
    this.hubConnection.stop();
    this.isConnected.set(false);
  }

  addSlide(presentationId: string) {
    this.ensureConnected();
    return this.hubConnection.invoke('AddSlide', presentationId);
  }

  addTextBlock(presentationId: string, slideId: string, text: string) {
    this.ensureConnected();
    return this.hubConnection.invoke(
      'AddTextBlock',
      presentationId,
      slideId,
      text
    );
  }

  addImageBlock(presentationId: string, slideId: string, url: string) {
    this.ensureConnected();
    return this.hubConnection.invoke(
      'AddImageBlock',
      presentationId,
      slideId,
      url
    );
  }

  updateElement(
    presentationId: string,
    slideId: string,
    element: SlideElement
  ) {
    this.ensureConnected();
    return this.hubConnection.invoke(
      'UpdateElement',
      presentationId,
      slideId,
      element
    );
  }

  removeElement(presentationId: string, slideId: string, elementId: string) {
    this.ensureConnected();
    return this.hubConnection.invoke(
      'RemoveElement',
      presentationId,
      slideId,
      elementId
    );
  }

  changeRole(
    presentationId: string,
    targetUserName: string,
    newRole: Exclude<Role, 'creator'>
  ) {
    this.ensureConnected();
    return this.hubConnection.invoke(
      'ChangeRole',
      presentationId,
      targetUserName,
      newRole
    );
  }
  private ensureConnected() {
    if (
      !this.hubConnection ||
      this.hubConnection.state !== HubConnectionState.Connected
    ) {
      throw new Error('SignalR Hub is not connected.');
    }
  }
}
