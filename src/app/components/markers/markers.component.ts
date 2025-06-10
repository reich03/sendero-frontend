import { Component, OnInit } from '@angular/core';
import { MarkerService, Point } from '../../services/marker.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkerDialogComponent } from '../../components/marker-dialog/marker-dialog.component';

@Component({
  selector: 'app-markers',
  templateUrl: './markers.component.html',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkerDialogComponent]
})
export class MarkersComponent implements OnInit {
  markers: Point[] = [];
  darkMode = false;
  showModal = false;
  currentMarker: Point | null = null;

  constructor(private markerService: MarkerService) { }

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
    this.loadMarkers();
  }

  loadMarkers(): void {
    this.markerService.getMarkers().subscribe(data => {
      console.log('Markers recibidos:', data);
      this.markers = data;
    });
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
  }

  openModal(marker?: Point): void {
    this.currentMarker = marker ? { ...marker } : this.getEmptyMarker();
    this.showModal = true;
    console.log('Modal abierto', this.showModal, this.currentMarker);
  }

  closeModal(): void {
    this.showModal = false;
    this.currentMarker = null;
  }

  saveMarker(data: {point: Point, image?: File}): void {
    if (data.point.id) {
      this.markerService.updateMarker(data.point.id, data.point, data.image).subscribe(() => {
        this.loadMarkers();
        this.closeModal();
      });
    } else {
      this.markerService.createMarker(data.point, data.image).subscribe(() => {
        this.loadMarkers();
        this.closeModal();
      });
    }
  }

  deleteMarker(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este punto?')) {
      this.markerService.deleteMarker(id).subscribe(() => {
        this.loadMarkers();
      });
    }
  }

  public getEmptyMarker(): Point {
    return {
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
  }
}
