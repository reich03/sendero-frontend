import { Component, ElementRef, EventEmitter, Input, OnInit, OnChanges, OnDestroy, SimpleChanges, Output, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Point } from '../../services/marker.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-marker-dialog',
  templateUrl: './marker-dialog.component.html',
  styleUrls: ['./marker-dialog.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class MarkerDialogComponent implements OnInit, OnChanges, OnDestroy {
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

  // Propiedades para el mapa
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  mapInitialized = false;

  constructor(private el: ElementRef, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      // Si el modal se hace visible, inicializa o actualiza el mapa
      setTimeout(() => {
        this.initializeOrUpdateMap();
      }, 300); // Pequeño retraso para asegurar que el DOM está listo
    }

    if (changes['data']) {
      // Resetear los campos de imagen cuando cambia el data
      this.imageFile = null;
      this.imagePreview = null;

      // Actualizar el marcador si el mapa ya está inicializado
      if (this.map && this.mapInitialized && this.data.lat && this.data.lng) {
        this.updateMarkerPosition(this.data.lat, this.data.lng);
      }
    }
  }

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('darkMode') === 'true';

    // Suscribirse a cambios en el tema oscuro (si tienes un servicio para esto)
    // this.themeService.darkMode$.subscribe(isDark => {
    //   this.darkMode = isDark;
    //   if (this.map) {
    //     this.updateMapStyle();
    //   }
    // });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.mapInitialized = false;
    }
  }

  // private initializeOrUpdateMap(): void {
  //   // Si el mapa ya está inicializado, actualiza el marcador
  //   if (this.mapInitialized && this.map) {
  //     if (this.data.lat && this.data.lng) {
  //       this.updateMarkerPosition(this.data.lat, this.data.lng);
  //     }
  //     return;
  //   }

  //   // Busca el elemento del mapa
  //   const mapElement = this.el.nativeElement.querySelector('#mini-map');
  //   if (!mapElement) {
  //     console.error('Elemento del mapa no encontrado');
  //     return;
  //   }

  //   // Inicializa el mapa
  //   this.map = L.map(mapElement, {
  //     center: [this.data.lat || 20, this.data.lng || 0], // Valores por defecto o los proporcionados
  //     zoom: 5,
  //     attributionControl: false
  //   });

  //   // Añade el tile layer apropiado según el modo (oscuro/claro)
  //   this.updateMapStyle();

  //   // Si hay coordenadas, añade un marcador
  //   if (this.data.lat && this.data.lng) {
  //     this.updateMarkerPosition(this.data.lat, this.data.lng);
  //   }

  //   // Añade evento click para actualizar la posición del marcador
  //   this.map.on('click', (e: L.LeafletMouseEvent) => {
  //     const latlng = e.latlng;
  //     this.updateMarkerPosition(latlng.lat, latlng.lng);

  //     // Actualiza los campos del formulario
  //     this.data.lat = parseFloat(latlng.lat.toFixed(6));
  //     this.data.lng = parseFloat(latlng.lng.toFixed(6));
  //     this.cdr.detectChanges();
  //   });

  //   // Invalidar tamaño para asegurar que el mapa se renderiza correctamente
  //   setTimeout(() => {
  //     if (this.map) {
  //       this.map.invalidateSize();
  //       this.mapInitialized = true;
  //     }
  //   }, 200);
  // }

  private initializeOrUpdateMap(): void {
    // Si el mapa ya está inicializado, actualiza el marcador
    if (this.mapInitialized && this.map) {
      if (this.data.lat && this.data.lng) {
        this.updateMarkerPosition(this.data.lat, this.data.lng);
      }
      return;
    }

    // Busca el elemento del mapa
    const mapElement = this.el.nativeElement.querySelector('#mini-map');
    if (!mapElement) {
      console.error('Elemento del mapa no encontrado');
      return;
    }

    // Coordenadas iniciales específicas para Colombia (4.2672743, -73.5684407)
    const initialLat = this.data.lat || 4.074;
    const initialLng = this.data.lng || -73.5832;
    const initialZoom = 10; // Zoom inicial menos amplio

    // Inicializa el mapa
    this.map = L.map(mapElement, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      attributionControl: false
    });

    // Añade el tile layer apropiado según el modo (oscuro/claro)
    this.updateMapStyle();

    // Si hay coordenadas, añade un marcador
    if (this.data.lat && this.data.lng) {
      this.updateMarkerPosition(this.data.lat, this.data.lng);
    }

    // Añade evento click para actualizar la posición del marcador
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;
      this.updateMarkerPosition(latlng.lat, latlng.lng);

      // Actualiza los campos del formulario
      this.data.lat = parseFloat(latlng.lat.toFixed(6));
      this.data.lng = parseFloat(latlng.lng.toFixed(6));
      this.cdr.detectChanges();
    });

    // Invalidar tamaño para asegurar que el mapa se renderiza correctamente
    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
        this.mapInitialized = true;
      }
    }, 200);
  }

  updateMapStyle(): void {
    if (!this.map) return;

    // Elimina las capas existentes
    this.map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        this.map?.removeLayer(layer);
      }
    });

    // Añade el tile layer apropiado según el modo (oscuro/claro)
    if (this.darkMode) {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(this.map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(this.map);
    }
  }

  updateMarkerPosition(lat: number, lng: number): void {
    if (!this.map) return;

    // Si ya existe un marcador, actualiza su posición
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      // Crea un nuevo marcador
      const markerIcon = this.getMarkerIcon();
      this.marker = L.marker([lat, lng], { draggable: true, icon: markerIcon }).addTo(this.map);

      // Añade evento para actualizar los campos cuando se arrastra el marcador
      this.marker.on('dragend', () => {
        const position = this.marker?.getLatLng();
        if (position) {
          this.data.lat = parseFloat(position.lat.toFixed(6));
          this.data.lng = parseFloat(position.lng.toFixed(6));
          this.cdr.detectChanges();
        }
      });
    }

    // Centra el mapa en la nueva posición
    this.map.setView([lat, lng], this.map.getZoom());
  }

  getMarkerIcon(): L.Icon {
    // Define iconos diferentes según el tipo seleccionado
    const iconUrl = this.getIconUrlByType(this.data.type);

    return L.icon({
      iconUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: 'assets/markers/marker-shadow.png',
      shadowSize: [41, 41]
    });
  }

  getIconUrlByType(type: string): string {
    // Configura diferentes iconos según el tipo
    switch (type) {
      case 'fauna':
        return '../../../assets/marker-fauna.png';
      case 'flora':
        return '../../../assets/marker-flora.png';
      case 'ecosistema':
        return '../../../assets/marker-eco.png';
      default:
        return '../../../assets/location-marker.png';
    }
  }

  // Actualizar el icono del marcador cuando cambia el tipo
  onTypeChange(): void {
    if (this.marker) {
      this.marker.setIcon(this.getMarkerIcon());
    }
  }

  // Buscar ubicación por nombre
  searchLocation(query: string): void {
    // Aquí podrías implementar una búsqueda por geocodificación
    // Ejemplo usando Nominatim (OpenStreetMap)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      .then(response => response.json())
      .then(data => {
        if (data && data.length > 0) {
          const result = data[0];
          this.data.lat = parseFloat(result.lat);
          this.data.lng = parseFloat(result.lon);
          this.updateMarkerPosition(this.data.lat, this.data.lng);
        }
      })
      .catch(error => console.error('Error buscando ubicación:', error));
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
