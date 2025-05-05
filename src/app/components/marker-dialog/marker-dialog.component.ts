import { Component, ElementRef, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Point } from '../../services/marker.service';

@Component({
  selector: 'app-marker-dialog',
  templateUrl: './marker-dialog.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MarkerDialogComponent implements OnInit, OnChanges {
  @Input() visible = false;
  @Input() data: Point = {
    id: 0,
    title: '',
    type: 'fauna',
    description: '',
    lat: 0,
    lng: 0,
    imageUrl: '',
    isFavorite: false,
    creator: '',
    createdAt: new Date().toISOString()
  };

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{point: Point, image?: File}>();

  darkMode = false;
  imageFile: File | null = null;
  imagePreview: string | null = null;

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible']) {
      console.log('Modal visibility changed to:', this.visible);
      this.cdr.detectChanges();
    }
    if (changes['data']) {
      console.log('Modal data changed to:', this.data);
      // Resetear los campos de imagen cuando cambia el data
      this.imageFile = null;
      this.imagePreview = null;
    }
  }

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('darkMode') === 'true';
    console.log('Modal component initialized', this.visible);

    // Forzar visibilidad
    if (this.visible) {
      setTimeout(() => {
        const modalContainer = this.el.nativeElement.querySelector('.modal-container');
        if (modalContainer) {
          console.log('Aplicando estilos al modal container');
          modalContainer.style.display = 'flex';
          this.cdr.detectChanges();
        }
      }, 100);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length) {
      this.imageFile = input.files[0];

      // Crear vista previa
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    this.save.emit({
      point: this.data,
      image: this.imageFile || undefined
    });
  }

  isFormValid(): boolean {
    return !!this.data.title && this.data.lat !== null && this.data.lng !== null;
  }
}
