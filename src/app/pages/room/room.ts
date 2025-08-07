import { Component, computed, OnDestroy, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HubService } from '../../services/hub.service';
import { DragDropModule } from '@angular/cdk/drag-drop';
import {
  ImageBlock,
  SlideElement,
  TextBlock,
} from '../../models/presentation.model';
import { UserService } from '../../services/user.service';
import { PresentationService } from '../../services/presentation.service';
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
  editingElementId = signal<string | null>(null);
  editingText = signal<string>('');
  imageLoading = signal(false);
  constructor(
    private route: ActivatedRoute,
    private hub: HubService,
    private presentationService: PresentationService,
    public userService: UserService
  ) {}

  ngOnInit(): void {
    this.presentationId = this.route.snapshot.params['id'];
    this.hub.connect(this.presentationId);
  }

  ngOnDestroy(): void {
    this.hub.disconnect();
  }

  onFileSelected(event: Event, slideId: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imageLoading.set(true);
    const connId = this.hub.getConnectionId();
    this.presentationService
      .uploadImage(this.presentationId, slideId, file, connId)
      .subscribe({
        next: () => {
          this.imageLoading.set(false);
        },
        error: (err) => {
          this.imageLoading.set(false);
        },
      });
  }
  startEditingTextBlock(slideId: string, el: TextBlock) {
    if (this.role() === 'viewer') return;
    this.selectedElementId.set(el.id);
    this.editingElementId.set(el.id);
    this.editingText.set(el.text);
  }
  saveTextEdit(slideId: string) {
    const id = this.editingElementId();
    if (!id) return;
    const newText = this.editingText();
    const arr = this.hub.elements()[slideId] ?? [];
    const el = arr.find((x) => x.id === id) as TextBlock | undefined;
    if (!el || newText === el.text) {
      this.editingElementId.set(null);
      return;
    }

    const updated: TextBlock = { ...el, text: newText };
    this.hub.elements.update((map) => {
      const a = map[slideId] ?? [];
      const idx = a.findIndex((x) => x.id === id);
      if (idx > -1) a[idx] = updated;
      return { ...map, [slideId]: a };
    });
    this.hub
      .updateElement(this.presentationId, slideId, updated)
      .catch(console.error);

    this.editingElementId.set(null);
  }
  cancelTextEdit() {
    this.editingElementId.set(null);
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
    this.selectedElementId.set(null);
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
    this.hub.addTextBlock(this.presentationId, slideId, 'Hello world');
  }

  removeElement(slideId: string, elementId: string): void {
    this.hub.removeElement(this.presentationId, slideId, elementId);
  }

  changeRole(userName: string, newRole: 'editor' | 'viewer'): void {
    this.hub.changeRole(this.presentationId, userName, newRole);
  }
}
