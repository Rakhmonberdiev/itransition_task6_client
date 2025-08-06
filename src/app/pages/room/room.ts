import {
  Component,
  computed,
  OnDestroy,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HubService } from '../../services/hub.service';
import { CdkDragEnd, DragDropModule, DragRef } from '@angular/cdk/drag-drop';
import {
  ImageBlock,
  SlideElement,
  TextBlock,
} from '../../models/presentation.model';
import { UserService } from '../../services/user.service';
@Component({
  selector: 'app-room',
  imports: [DragDropModule],
  templateUrl: './room.html',
  styleUrl: './room.css',
})
export class Room implements OnInit, OnDestroy {
  private presentationId!: string;
  slides = computed(() => this.hub.slides());
  elements = computed(() => this.hub.elements());
  users = computed(() => this.hub.users());
  role = computed(() => this.hub.currentRole());
  connected = computed(() => this.hub.isConnected());
  currentSlideId = signal<string | null>(null);
  selectedElementId = signal<string | null>(null);
  constructor(
    private route: ActivatedRoute,
    private hub: HubService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.presentationId = this.route.snapshot.params['id'];
    this.hub.connect(this.presentationId);
  }

  ngOnDestroy(): void {
    this.hub.disconnect();
  }

  onDragEnded(event: any, slideId: string, el: SlideElement) {
    if (this.role() === 'viewer') return;
    const { x, y } = event.source.getFreeDragPosition();
    this.hub.elements.update((map) => {
      const arr = map[slideId]!;
      const idx = arr.findIndex((e) => e.id === el.id);
      if (idx > -1) arr[idx] = { ...arr[idx], x, y };
      return { ...map, [slideId]: arr };
    });

    this.hub
      .updateElement(this.presentationId, slideId, { ...el, x, y })
      .catch(console.error);
  }
  selectElement(elId: string, slideId: string) {
    this.selectedElementId.set(elId);
    this.currentSlideId.set(slideId);
  }
  isTextBlock(el: SlideElement): el is TextBlock {
    return el.$type === 'text';
  }

  isImageBlock(el: SlideElement): el is ImageBlock {
    return el.$type === 'image';
  }

  addSlide(): void {
    this.hub.addSlide(this.presentationId);
  }

  addTextBlock(slideId: string): void {
    this.hub.addTextBlock(this.presentationId, slideId, 'Новый текст');
  }

  addImageBlock(slideId: string): void {
    this.hub.addImageBlock(this.presentationId, slideId, 'welcome.png');
  }
  removeElement(slideId: string, elementId: string): void {
    this.hub.removeElement(this.presentationId, slideId, elementId);
  }

  changeRole(userName: string, newRole: 'editor' | 'viewer'): void {
    this.hub.changeRole(this.presentationId, userName, newRole);
  }
}
