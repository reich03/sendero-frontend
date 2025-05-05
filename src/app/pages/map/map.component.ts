import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { MapService, Point, PointType } from '../../services/map.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
})
export class MapComponent implements OnInit, AfterViewInit {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  map: L.Map | undefined;
  markers: L.Marker[] = [];
  selectedPoint: Point | null = null;
  showInfoPanel = false;
  showFavoriteAlert = false;
  favoriteAlertMessage = '';
  darkMode = false;
  isGuest = true;
  points: Point[] = [];
  isLoading = true;
  loadingError = false;
  activeFilters: {
    fauna: boolean;
    flora: boolean;
    ecosistema: boolean;
    destacados: boolean;
  } = {
      fauna: true,
      flora: true,
      ecosistema: true,
      destacados: false,
    };
  searchTerm = '';

  @ViewChild('infoPanel') infoPanel!: ElementRef;
  routeControl: L.Routing.Control | null = null;

  constructor(
    private mapService: MapService,
    private renderer: Renderer2,
    private router: Router,
    private cookieService: CookieService,


  ) { }

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }


    const userData =this.cookieService.get(this.TOKEN_KEY);
    this.isGuest = !userData;
    console.log(userData)
    this.initMap();
  }

  ngAfterViewInit() {
    if (this.map) {
      setTimeout(() => {
        this.map?.invalidateSize();
      }, 100);
    }
  }

  initMap() {
    this.map = L.map('map').setView([4.074, -73.5839], 17);

    this.updateMapStyle();

    L.control.scale({
      imperial: false,
      metric: true,
      position: 'bottomleft'
    }).addTo(this.map);

    // Cargar puntos del backend
    this.fetchPoints();

    const logoControl = L.Control.extend({
      options: {
        position: 'bottomright'
      },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'map-logo');
        container.innerHTML = '<img src="../../../assets/Logo Unillanos-Horizontal.png" alt="Logo Unillanos" style="width: 120px; background-color: white; padding: 5px; border-radius: 5px;">';
        return container;
      }
    });

    this.map.addControl(new logoControl());
  }

  fetchPoints() {
    this.isLoading = true;
    this.loadingError = false;

    this.mapService.getZonas().subscribe({
      next: (data:any) => {
        this.points = data;
        this.isLoading = false;
        this.loadPoints();
      },
      error: (error:any) => {
        console.error('Error obteniendo zonas:', error);
        this.isLoading = false;
        this.loadingError = true;
      }
    });
  }

  loadPoints() {
    this.clearMarkers();

    this.points.forEach(point => {
      if (!this.shouldDisplayPoint(point)) {
        return;
      }

      let marker;

      if (point.type === 'fauna' || point.type === 'flora' || point.type === 'ecosistema') {
        const icon = this.getMarkerIcon(point.type);
        marker = L.marker([point.lat, point.lng], { icon });
      } else {
        marker = L.marker([point.lat, point.lng]);
      }

      marker.addTo(this.map!)
        .on('click', () => {
          this.showPointDetails(point);
        });

      marker.bindPopup(`<b>${point.title}</b><br>${point.type}`);

      this.markers.push(marker);
    });
  }

  clearMarkers() {
    this.markers.forEach(marker => {
      this.map?.removeLayer(marker);
    });
    this.markers = [];
  }

  getMarkerIcon(type: PointType): L.Icon {
    let iconUrl = '';

    switch (type) {
      case 'fauna':
        iconUrl = '../../../assets/marker-fauna.png';
        break;
      case 'flora':
        iconUrl = '../../../assets/marker-flora.png';
        break;
      case 'ecosistema':
        iconUrl = '../../../assets/marker-eco.png';
        break;
      default:
        return L.icon({
          iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          className: `marker-${type}`
        });
    }

    try {
      return L.icon({
        iconUrl,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
      });
    } catch (e) {
      console.error("Error cargando icono personalizado, usando el icono predeterminado", e);
      return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        className: `marker-${type}`,
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png'
      });
    }
  }

  showPointDetails(point: Point) {
    this.selectedPoint = point;
    this.showInfoPanel = true;

    // Volar al punto en el mapa
    this.map?.flyTo([point.lat, point.lng], 17, {
      duration: 1
    });

    const button = `<button id="get-directions" class="btn-directions">Cómo llegar</button>`;

    L.popup()
      .setLatLng([point.lat, point.lng])
      .setContent(button)
      .openOn(this.map!);

    setTimeout(() => {
      const directionsButton = document.getElementById('get-directions');
      if (directionsButton) {
        directionsButton.addEventListener('click', () => {
          this.getDirections(point.lat, point.lng);
        });
      }
    }, 50);

    setTimeout(() => {
      if (this.infoPanel && this.infoPanel.nativeElement) {
        this.renderer.addClass(this.infoPanel.nativeElement, 'visible');
      }
    }, 50);
  }

  getDirections(destinationLat: number, destinationLng: number) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        if (this.routeControl) {
          this.map?.removeControl(this.routeControl);
        }

        this.routeControl = L.Routing.control({
          waypoints: [
            L.latLng(userLat, userLng),
            L.latLng(destinationLat, destinationLng)
          ],
          routeWhileDragging: true
        }).addTo(this.map!);
      });
    } else {
      alert("Geolocalización no soportada por el navegador.");
    }
  }

  toggleFavorite(point: Point) {
    point.isFavorite = !point.isFavorite;
    this.mapService.toggleFavorite(point.id);

    this.favoriteAlertMessage = point.isFavorite
      ? `¡${point.title} añadido a favoritos!`
      : `${point.title} eliminado de favoritos`;
    this.showFavoriteAlert = true;

    setTimeout(() => {
      this.showFavoriteAlert = false;
    }, 3000);

    if (this.activeFilters.destacados) {
      this.loadPoints();
    }
  }

  toggleDarkMode() {
    this.darkMode = !this.darkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');

    this.updateMapStyle();
  }

  updateMapStyle() {
    if (!this.map) return;

    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        this.map?.removeLayer(layer);
      }
    });

    if (this.darkMode) {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
      }).addTo(this.map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(this.map);
    }

    this.loadPoints();
  }

  closeInfoPanel() {
    // Primero removemos la clase visible para activar la animación de salida
    if (this.infoPanel && this.infoPanel.nativeElement) {
      this.renderer.removeClass(this.infoPanel.nativeElement, 'visible');
    }

    // Después de un tiempo para que se complete la animación, ocultamos el panel
    setTimeout(() => {
      this.showInfoPanel = false;
      this.selectedPoint = null;
    }, 300);
  }

  applyFilters() {
    this.loadPoints();
  }

  resetFilters() {
    this.activeFilters = {
      fauna: true,
      flora: true,
      ecosistema: true,
      destacados: false
    };
    this.searchTerm = '';
    this.loadPoints();
  }

  shouldDisplayPoint(point: Point): boolean {
    // Filtrar por tipo
    if (!this.activeFilters[point.type]) {
      return false;
    }

    // Filtrar por destacados
    if (this.activeFilters.destacados && !point.isFavorite) {
      return false;
    }

    // Filtrar por término de búsqueda
    if (this.searchTerm && !point.title.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
      !point.description.toLowerCase().includes(this.searchTerm.toLowerCase())) {
      return false;
    }

    return true;
  }

  logout() {
    this.cookieService.delete(this.TOKEN_KEY);
    this.cookieService.delete(this.USER_KEY);
    window.location.reload();
  }

  openARView() {
    if (!this.selectedPoint) return;

    // Aquí se implementaría la apertura de la vista AR
    alert(`Abriendo vista de Realidad Aumentada para: ${this.selectedPoint.title}`);
    // En una implementación real, se integraría con una biblioteca AR
  }

  refreshMap() {
    this.fetchPoints();
  }
}
