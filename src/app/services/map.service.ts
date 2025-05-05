import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
export class MapService {
  private apiUrl = 'http://localhost:8092/api/zonas';
  private favorites: number[] = [];

  constructor(private http: HttpClient) {
    // Cargar favoritos del localStorage si existen
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      this.favorites = JSON.parse(savedFavorites);
    }
  }

  getZonas(): Observable<Point[]> {
    return this.http.get<ZonaResponse[]>(this.apiUrl).pipe(
      map(zonas => this.mapZonasToPoints(zonas))
    );
  }

  private mapZonasToPoints(zonas: ZonaResponse[]): Point[] {
    return zonas.map(zona => {
      const pointType = zona.tipo.toLowerCase() as PointType;

      // Asegúrate de que no haya doble barra
      const imageUrl = zona.imagenes.length > 0
        ? `http://localhost:8092${zona.imagenes[0].startsWith('/') ? zona.imagenes[0] : '/' + zona.imagenes[0]}`
        : this.getDefaultImageForType(pointType);

      // Aplica la misma lógica para imágenes adicionales
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
        imageUrl: imageUrl,
        additionalImages: additionalImages.length > 0 ? additionalImages : undefined,
        isFavorite: this.favorites.includes(zona.id),
        creator: zona.creadoPor,
        createdAt: zona.fechaCreacion,
        dailyVisits: Math.floor(Math.random() * 100),
        hasAR: Math.random() > 0.5,
        comments: zona.comentarios
      };
    });
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

  toggleFavorite(id: number): void {
    const index = this.favorites.indexOf(id);
    if (index === -1) {
      this.favorites.push(id);
    } else {
      this.favorites.splice(index, 1);
    }
    // Guardar en localStorage
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }

  getPoints(): Point[] {
    // Este método se mantiene para compatibilidad, pero ahora recomendamos usar getZonas()
    return [];
  }
}
