import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Asegúrate de importar map
import { CookieService } from 'ngx-cookie-service';

export interface AuditLog {
  id: number;
  username: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
}

interface ZonaVisitadaResponse {
  zona: {
    id: number;
    nombre: string;
    tipo: string;
    descripcion: string;
    latitud: number;
    longitud: number;
    imagenes: string[];
    creadoPor: string;
    fechaCreacion: string;
    comentarios: string[];
  };
  log: {
    id: number;
    username: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    timestamp: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuditService {
  private apiUrl = 'http://localhost:8092/api/audit/';
  private apiUrl2 = 'http://localhost:8092/api/audit/zona/visitar';
  private apiUrl3 = 'http://localhost:8092/api/audit/zonas-visitadas';
  private favorites: number[] = [];

  constructor(private http: HttpClient, private cookieService: CookieService) {
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      this.favorites = JSON.parse(savedFavorites);
    }
  }

  getAllLogs(): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(this.apiUrl);
  }

  registrarVisitaZona(zonaId: number, ip: string | null): Observable<any> {
    let params = new HttpParams().set('zonaId', zonaId.toString()).set('ip', ip ?? '127.0.0.1');
    return this.http.post(this.apiUrl2, undefined, { params });
  }

  getZonasVisitadas(): Observable<ZonaVisitadaResponse[]> {
    return this.http.get<ZonaVisitadaResponse[]>(this.apiUrl3).pipe(
      map(zonas => this.mapZonasToVisitadas(zonas)) // Ahora 'map' está importado y listo para ser utilizado
    );
  }

  private mapZonasToVisitadas(zonas: ZonaVisitadaResponse[]): ZonaVisitadaResponse[] {
    return zonas.map(zona => {
      const pointType = zona.zona.tipo.toLowerCase();

      const imageUrl = zona.zona.imagenes.length > 0
        ? `http://localhost:8092${zona.zona.imagenes[0].startsWith('/') ? zona.zona.imagenes[0] : '/' + zona.zona.imagenes[0]}`
        : this.getDefaultImageForType(pointType);

      const additionalImages = zona.zona.imagenes.slice(1).map(img =>
        `http://localhost:8092${img.startsWith('/') ? img : '/' + img}`
      );

      return {
        ...zona,
        zona: {
          ...zona.zona,
          imagenes: [imageUrl, ...additionalImages]
        }
      };
    });
  }

  private getDefaultImageForType(type: string): string {
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
    localStorage.setItem('favorites', JSON.stringify(this.favorites));
  }
}
