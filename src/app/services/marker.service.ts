import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type PointType = 'fauna' | 'flora' | 'ecosistema';

export interface Point {
  id: number;
  title: string;
  type: PointType;
  description: string;
  lat: number;
  lng: number;
  imageUrl: string;
  additionalImages?: string[];
  isFavorite: boolean;
  creator: string;
  createdAt: string;
  dailyVisits?: number;
  hasAR?: boolean;
  comments?: any[];
}

export interface ZonaResponse {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  latitud: number;
  longitud: number;
  imagenes: string[];
  creadoPor: string;
  fechaCreacion: string;
  comentarios: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MarkerService {
  private apiUrl = 'http://localhost:8092/api/zonas';
  private favorites: number[] = [];

  constructor(private http: HttpClient) {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      this.favorites = JSON.parse(savedFavorites);
    }
  }

  getMarkers(): Observable<Point[]> {
    return this.http.get<ZonaResponse[]>(this.apiUrl).pipe(
      map(zonas => this.mapZonasToPoints(zonas))
    );
  }

  createMarker(point: Point, image?: File): Observable<Point> {
    // Si hay una imagen, usamos FormData
    if (image) {
      const formData = new FormData();

      // Convertir el punto a formato esperado por el backend
      const zona = {
        nombre: point.title,
        tipo: point.type.toUpperCase(), // El backend espera 'FLORA', 'FAUNA'
        descripcion: point.description,
        latitud: point.lat,
        longitud: point.lng
      };

      formData.append('zona', new Blob([JSON.stringify(zona)], { type: 'application/json' }));
      formData.append('imagenes', image);

      // Obtener token del localStorage (asumiendo que está almacenado ahí)
      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': token || ''
      });

      return this.http.post<Point>(this.apiUrl, formData, { headers });
    } else {
      // Sin imagen, enviamos JSON directamente
      return this.http.post<Point>(this.apiUrl, point);
    }
  }

  updateMarker(id: number, point: Point, image?: File): Observable<Point> {
    if (image) {
      const formData = new FormData();

      const zona = {
        nombre: point.title,
        tipo: point.type.toUpperCase(),
        descripcion: point.description,
        latitud: point.lat,
        longitud: point.lng
      };

      formData.append('zona', new Blob([JSON.stringify(zona)], { type: 'application/json' }));
      formData.append('imagenes', image);

      const token = localStorage.getItem('authToken');
      const headers = new HttpHeaders({
        'Authorization': token || ''
      });

      return this.http.put<Point>(`${this.apiUrl}/${id}`, formData, { headers });
    } else {
      return this.http.put<Point>(`${this.apiUrl}/${id}`, point);
    }
  }

  // deleteMarker(id: number): Observable<void> {
  //   return this.http.delete<void>(`${this.apiUrl}/${id}`);
  // }

  deleteMarker(id: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': token || ''
    });

    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }

  private mapZonasToPoints(zonas: ZonaResponse[]): Point[] {
    return zonas.map(zona => {
      const pointType = zona.tipo.toLowerCase() as PointType;
      const imageUrl = zona.imagenes.length > 0
        ? `http://localhost:8092${zona.imagenes[0].startsWith('/') ? zona.imagenes[0] : '/' + zona.imagenes[0]}`
        : this.getDefaultImageForType(pointType);

      const additionalImages = zona.imagenes.slice(1).map(img =>
        `http://localhost:8092${img.startsWith('/') ? img : '/' + img}`
      );

      return {
        id: zona.id,
        title: zona.nombre,
        type: pointType,
        description: zona.descripcion,
        lat: zona.latitud,
        lng: zona.longitud,
        imageUrl,
        additionalImages: additionalImages.length ? additionalImages : undefined,
        isFavorite: this.favorites.includes(zona.id),
        creator: zona.creadoPor,
        createdAt: zona.fechaCreacion,
        dailyVisits: Math.floor(Math.random() * 100),
        hasAR: Math.random() > 0.5,
        comments: zona.comentarios
      };
    });
  }

  private mapPointToZona(point: Point): ZonaResponse {
    return {
      id: point.id,
      nombre: point.title,
      tipo: point.type,
      descripcion: point.description,
      latitud: point.lat,
      longitud: point.lng,
      imagenes: [point.imageUrl, ...(point.additionalImages || [])],
      creadoPor: point.creator,
      fechaCreacion: point.createdAt,
      comentarios: point.comments || []
    };
  }

  private getDefaultImageForType(type: PointType): string {
    switch (type) {
      case 'fauna':
        return '../../../assets/default-fauna.jpg';
      case 'flora':
        return '../../../assets/default-flora.jpg';
      case 'ecosistema':
        return '../../../assets/default-ecosistema.jpg';
      default:
        return '../../../assets/default-marker.jpg';
    }
  }
}
