import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Renderer2,
} from '@angular/core';
import * as L from 'leaflet';
import 'leaflet-routing-machine';
import { MapService, Point, PointType } from '../../services/map.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { AuditService } from '../../services/audit.service';

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
  isRouteActive = false;

  @ViewChild('infoPanel') infoPanel!: ElementRef;
  routeControl: L.Routing.Control | null = null;

  constructor(
    private mapService: MapService,
    private renderer: Renderer2,
    private router: Router,
    private cookieService: CookieService,
    private auditService: AuditService
  ) {}

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }

    const userData = this.cookieService.get(this.TOKEN_KEY);
    this.isGuest = !userData;
    console.log(userData);
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

    L.control
      .scale({
        imperial: false,
        metric: true,
        position: 'bottomleft',
      })
      .addTo(this.map);

    this.fetchPoints();

    const logoControl = L.Control.extend({
      options: {
        position: 'bottomright',
      },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'map-logo');
        container.innerHTML =
          '<img src="../../../assets/Logo Unillanos-Horizontal.png" alt="Logo Unillanos" style="width: 120px; background-color: white; padding: 5px; border-radius: 5px;">';
        return container;
      },
    });

    this.map.addControl(new logoControl());
  }

  fetchPoints() {
    this.isLoading = true;
    this.loadingError = false;

    this.mapService.getZonas().subscribe({
      next: (data: any) => {
        this.points = data;
        this.isLoading = false;
        this.loadPoints();
      },
      error: (error: any) => {
        console.error('Error obteniendo zonas:', error);
        this.isLoading = false;
        this.loadingError = true;
      },
    });
  }

  // loadPoints() {
  //   this.clearMarkers();

  //   this.points.forEach((point) => {
  //     if (!this.shouldDisplayPoint(point)) {
  //       return;
  //     }

  //     let marker;

  //     if (
  //       point.type === 'fauna' ||
  //       point.type === 'flora' ||
  //       point.type === 'ecosistema'
  //     ) {
  //       const icon = this.getMarkerIcon(point.type);
  //       marker = L.marker([point.lat, point.lng], { icon });
  //     } else {
  //       marker = L.marker([point.lat, point.lng]);
  //     }

  //     marker.addTo(this.map!).on('click', () => {
  //       // Show point info in the side panel
  //       this.showPointDetails(point);
  //     });

  //     this.markers.push(marker);
  //   });
  // }

  // Modifica la función loadPoints en el archivo map.component.ts
  // Busca esta función y reemplaza el código donde creas los marcadores

  loadPoints() {
    this.clearMarkers();
    this.points.forEach((point) => {
      if (!this.shouldDisplayPoint(point)) {
        return;
      }

      let marker;
      if (
        point.type === 'fauna' ||
        point.type === 'flora' ||
        point.type === 'ecosistema'
      ) {
        const icon = this.getMarkerIcon(point.type);
        marker = L.marker([point.lat, point.lng], { icon });
      } else {
        marker = L.marker([point.lat, point.lng]);
      }

      // Crear el contenido del popup
      const popupContent = `
        <div class="popup-info">
          <h3 class="font-bold">${point.title}</h3>
          <div class="text-sm">${point.type}</div>
          <button class="directions-btn bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded mt-2 text-sm flex items-center justify-center w-full"
                 data-lat="${point.lat}"
                 data-lng="${point.lng}">
            <i class="fas fa-directions mr-1"></i> Cómo llegar
          </button>
        </div>
      `;

      // Crear el popup con este contenido
      const popup = L.popup().setContent(popupContent);

      // Asignar el popup al marcador
      marker.bindPopup(popup);

      marker.on('click', () => {
        this.showPointDetails(point);
        this.registerVisit(point.id);
        this.requestLocationPermission(point);
      });

      // Manejar el evento de apertura del popup para configurar el botón de direcciones
      marker.on('popupopen', () => {
        console.log('Popup abierto para:', point.title);

        // Obtener todos los botones de direcciones dentro del popup y agregar los listeners de clic
        const directionButtons = document.querySelectorAll('.directions-btn');
        directionButtons.forEach(btn => {
          // Asegúrate de que `btn` es un elemento del DOM, no un nodo genérico
          const buttonElement = btn as HTMLElement; // Type assertion a HTMLElement

          // Eliminar los listeners existentes para evitar duplicados
          const newBtn = buttonElement.cloneNode(true) as HTMLElement;
          if (buttonElement.parentNode) {
            buttonElement.parentNode.replaceChild(newBtn, buttonElement);
          }

          // Añadir el listener de clic
          newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Botón de dirección clickeado para:', point.title);

            const lat = parseFloat(newBtn.getAttribute('data-lat') || '0');
            const lng = parseFloat(newBtn.getAttribute('data-lng') || '0');

            if (lat && lng) {
              this.getDirections(lat, lng);
            } else {
              console.error('Coordenadas inválidas para la ruta');
            }
          });
        });
      });

      this.markers.push(marker);
      marker.addTo(this.map!);
    });
  }

  requestLocationPermission(point: Point) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          console.log('Ubicación obtenida: ', userLat, userLng);

          this.registerVisit(point.id, userLat, userLng);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            alert('Se denegó el permiso para acceder a la ubicación.');
            this.registerVisit(point.id, null);
          } else {
            alert('Hubo un problema al obtener la ubicación.');
          }
        }
      );
    } else {
      alert('La geolocalización no es compatible con este navegador.');
      this.registerVisit(point.id, null);
    }
  }

  registerVisit(zonaId: number, userLat: number | null = null, userLng: number | null = null) {
    let ip = null;

    if (userLat === null || userLng === null) {
      ip = '127.0.0.1';
    }

    // Registrar la visita con la IP (o ubicación si la obtenemos)
    this.auditService.registrarVisitaZona(zonaId, ip).subscribe(
      (response) => {
        console.log('Visita registrada correctamente', response);
      },
      (error) => {
        console.error('Error al registrar visita', error);
      }
    );
  }
  getDirections2(destinationLat: number, destinationLng: number, userLat: number, userLng: number) {
    console.log('Obteniendo direcciones de:', userLat, userLng, 'a', destinationLat, destinationLng);

  }


  clearMarkers() {
    this.markers.forEach((marker) => {
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
          iconUrl:
            'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowUrl:
            'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
          className: `marker-${type}`,
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
      console.error(
        'Error cargando icono personalizado, usando el icono predeterminado',
        e
      );
      return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        className: `marker-${type}`,
        shadowUrl:
          'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    }
  }

  showPointDetails(point: Point) {
    this.selectedPoint = point;
    this.showInfoPanel = true;

    console.log('Viajando al punto:', point);
    this.map?.flyTo([point.lat, point.lng], 17, {
      duration: 1,
    });

    this.map?.closePopup();

    setTimeout(() => {
      if (this.infoPanel && this.infoPanel.nativeElement) {
        this.renderer.addClass(this.infoPanel.nativeElement, 'visible');
      }
    }, 50);
  }

  // getDirections(destinationLat: number, destinationLng: number) {
  //   console.log('Obteniendo direcciones a:', destinationLat, destinationLng);
  //   this.isRouteActive = true;

  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         const userLat = position.coords.latitude;
  //         const userLng = position.coords.longitude;

  //         if (this.routeControl) {
  //           this.map?.removeControl(this.routeControl);
  //         }

  //         // Crear un contenedor personalizado para el control de ruta
  //         const routeContainer = document.createElement('div');
  //         routeContainer.className = 'custom-route-container';

  //         // Aplicar estilos personalizados al control de ruta
  //         // Usar type assertion (as any) para evitar errores de TypeScript con propiedades personalizadas
  //         this.routeControl = L.Routing.control({
  //           waypoints: [
  //             L.latLng(userLat, userLng),
  //             L.latLng(destinationLat, destinationLng),
  //           ],
  //           routeWhileDragging: true,
  //           lineOptions: {
  //             styles: [
  //               { color: '#10b981', opacity: 0.8, weight: 6 },
  //               { color: '#ffffff', opacity: 0.3, weight: 10 }
  //             ],
  //             extendToWaypoints: true,
  //             missingRouteTolerance: 0
  //           },
  //           show: true,
  //           addWaypoints: false,
  //           draggableWaypoints: true,
  //           fitSelectedRoutes: true,
  //           showAlternatives: false
  //         } as any).addTo(this.map!);

  //         // Personalizamos los marcadores después de crear el control
  //         this.routeControl.on('routesfound', (e) => {
  //           // Eliminar marcadores existentes si los hay
  //           if (this.map) {
  //             const existingMarkers = document.querySelectorAll('.custom-route-marker');
  //             existingMarkers.forEach(marker => {
  //               marker.parentNode?.removeChild(marker);
  //             });
  //           }

  //           // Crear marcadores personalizados en los puntos de inicio y fin
  //           const startPoint = e.routes[0].coordinates[0];
  //           const endPoint = e.routes[0].coordinates[e.routes[0].coordinates.length - 1];

  //           // Marcador de inicio
  //           const startMarkerIcon = L.divIcon({
  //             className: 'custom-route-marker',
  //             html: '<div class="route-marker start-marker"></div>',
  //             iconSize: [20, 20]
  //           });
  //           L.marker([startPoint.lat, startPoint.lng], { icon: startMarkerIcon }).addTo(this.map!);

  //           // Marcador de fin
  //           const endMarkerIcon = L.divIcon({
  //             className: 'custom-route-marker',
  //             html: '<div class="route-marker end-marker"></div>',
  //             iconSize: [20, 20]
  //           });
  //           L.marker([endPoint.lat, endPoint.lng], { icon: endMarkerIcon }).addTo(this.map!);
  //         });

  //         // Agregar clase personalizada al contenedor de rutas
  //         setTimeout(() => {
  //           const routeContainer = document.querySelector('.leaflet-routing-container');
  //           if (routeContainer) {
  //             this.renderer.addClass(routeContainer, 'enhanced-route');

  //             if (this.darkMode) {
  //               this.renderer.addClass(routeContainer, 'dark-mode');
  //             }
  //           }
  //         }, 100);
  //       },
  //       (error) => {
  //         this.isRouteActive = false;
  //         if (error.code === error.PERMISSION_DENIED) {
  //           alert(
  //             'No se pudo acceder a tu ubicación. Asegúrate de permitir la geolocalización en tu navegador.'
  //           );
  //         } else if (error.code === error.POSITION_UNAVAILABLE) {
  //           alert('No se pudo determinar tu ubicación.');
  //         } else if (error.code === error.TIMEOUT) {
  //           alert(
  //             'El intento para obtener tu ubicación ha excedido el tiempo de espera.'
  //           );
  //         } else {
  //           alert(
  //             'Ocurrió un error inesperado al intentar obtener tu ubicación.'
  //           );
  //         }
  //       }
  //     );
  //   } else {
  //     this.isRouteActive = false;
  //     alert('Geolocalización no soportada por este navegador.');
  //   }
  // }

  // Método getDirections mejorado para mejor visualización
  getDirections(destinationLat: number, destinationLng: number) {
    console.log('Obteniendo direcciones a:', destinationLat, destinationLng);
    this.isRouteActive = true;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;

          if (this.routeControl) {
            this.map?.removeControl(this.routeControl);
          }

          // Cerrar cualquier popup abierto
          this.map?.closePopup();

          // Crear control de ruta con estilos mejorados
          this.routeControl = L.Routing.control({
            waypoints: [
              L.latLng(userLat, userLng),
              L.latLng(destinationLat, destinationLng),
            ],
            routeWhileDragging: true,
            lineOptions: {
              styles: [
                { color: '#10b981', opacity: 0.8, weight: 6 },
                { color: '#ffffff', opacity: 0.3, weight: 10 },
              ],
              extendToWaypoints: true,
              missingRouteTolerance: 0,
            },
            show: true,
            addWaypoints: false,
            draggableWaypoints: true,
            fitSelectedRoutes: true,
            showAlternatives: false,
            collapsible: true,
            createMarker: (i: any, waypoint: any, n: any) => {
              // Crear marcadores personalizados para inicio y fin
              const markerOptions = {
                icon: L.divIcon({
                  className: i === 0 ? 'start-marker-icon' : 'end-marker-icon',
                  html: `<div class="route-marker ${
                    i === 0 ? 'start-marker' : 'end-marker'
                  }"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                }),
              };
              return L.marker(waypoint.latLng, markerOptions);
            },
          } as any).addTo(this.map!);

          // Personalizar contenedor de ruta después de crearlo
          this.routeControl.on('routesfound', () => {
            // Añadir botón de cancelar ruta al panel de instrucciones
            setTimeout(() => {
              const routeContainer = document.querySelector(
                '.leaflet-routing-container'
              );
              if (routeContainer) {
                const cancelButton = document.createElement('button');
                cancelButton.className = 'cancel-route-button';
                cancelButton.innerHTML =
                  '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> Cancelar ruta';
                cancelButton.onclick = () => this.cancelRoute();

                const summaryContainer = routeContainer.querySelector(
                  '.leaflet-routing-alt'
                );
                if (summaryContainer) {
                  summaryContainer.parentNode?.insertBefore(
                    cancelButton,
                    summaryContainer.nextSibling
                  );
                } else {
                  routeContainer.appendChild(cancelButton);
                }

                this.renderer.addClass(routeContainer, 'enhanced-route');

                if (this.darkMode) {
                  this.renderer.addClass(routeContainer, 'dark-mode');
                }
              }
            }, 100);
          });
        },
        (error) => {
          this.isRouteActive = false;
          if (error.code === error.PERMISSION_DENIED) {
            alert(
              'No se pudo acceder a tu ubicación. Asegúrate de permitir la geolocalización en tu navegador.'
            );
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            alert('No se pudo determinar tu ubicación.');
          } else if (error.code === error.TIMEOUT) {
            alert(
              'El intento para obtener tu ubicación ha excedido el tiempo de espera.'
            );
          } else {
            alert(
              'Ocurrió un error inesperado al intentar obtener tu ubicación.'
            );
          }
        }
      );
    } else {
      this.isRouteActive = false;
      alert('Geolocalización no soportada por este navegador.');
    }
  }

  cancelRoute() {
    if (this.routeControl) {
      this.map?.removeControl(this.routeControl);
      this.routeControl = null;
      this.isRouteActive = false;
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

    if (this.isRouteActive) {
      const routeContainer = document.querySelector(
        '.leaflet-routing-container'
      );
      if (routeContainer) {
        if (this.darkMode) {
          this.renderer.addClass(routeContainer, 'dark-mode');
        } else {
          this.renderer.removeClass(routeContainer, 'dark-mode');
        }
      }
    }
  }

  updateMapStyle() {
    if (!this.map) return;

    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        this.map?.removeLayer(layer);
      }
    });

    if (this.darkMode) {
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(this.map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(this.map);
    }

    this.loadPoints();
  }

  closeInfoPanel() {
    if (this.infoPanel && this.infoPanel.nativeElement) {
      this.renderer.removeClass(this.infoPanel.nativeElement, 'visible');
    }

    setTimeout(() => {
      this.showInfoPanel = false;
      this.selectedPoint = null;

      if (this.isRouteActive) {
        this.cancelRoute();
      }
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
      destacados: false,
    };
    this.searchTerm = '';
    this.loadPoints();
  }

  shouldDisplayPoint(point: Point): boolean {
    // Filtrar por tipo
    if (!this.activeFilters[point.type]) {
      return false;
    }

    if (this.activeFilters.destacados && !point.isFavorite) {
      return false;
    }

    if (
      this.searchTerm &&
      !point.title.toLowerCase().includes(this.searchTerm.toLowerCase()) &&
      !point.description.toLowerCase().includes(this.searchTerm.toLowerCase())
    ) {
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

    alert(
      `Abriendo vista de Realidad Aumentada para: ${this.selectedPoint.title}`
    );
  }

  refreshMap() {
    this.fetchPoints();
  }
}
