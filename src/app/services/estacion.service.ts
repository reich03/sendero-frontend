import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Estacion } from '../models/estacion.model';

@Injectable({
  providedIn: 'root'
})
export class EstacionService {
  private apiUrl = 'http://localhost:8092/api/estaciones';

  constructor(private http: HttpClient) {}

  // Método para leer cookies
  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }

  // Método para verificar si hay token válido en cookies
  private checkAuthToken(): string {
    const token = this.getCookie('jwt');

    if (!token) {
      console.error('No JWT token found in cookies');
      throw new Error('No authentication token found. Please login again.');
    }

    // Asegurar que el token tenga el prefijo Bearer
    return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  }

  private getAuthHeaders(): HttpHeaders {
    const bearerToken = this.checkAuthToken();
    console.log('Token being used from cookies:', bearerToken);

    return new HttpHeaders({
      'Authorization': bearerToken,
      'Content-Type': 'application/json'
    });
  }

  private getAuthHeadersForFormData(): HttpHeaders {
    const bearerToken = this.checkAuthToken();
    console.log('Token for FormData from cookies:', bearerToken);

    return new HttpHeaders({
      'Authorization': bearerToken
      // NO incluir Content-Type para FormData
    });
  }

  listarEstaciones(): Observable<Estacion[]> {
    return this.http.get<Estacion[]>(this.apiUrl);
  }

  obtenerEstacion(id: number): Observable<Estacion> {
    return this.http.get<Estacion>(`${this.apiUrl}/${id}`);
  }

  crearEstacion(formData: FormData): Observable<Estacion> {
    // Debug: Verificar FormData y token
    console.log('=== CREANDO ESTACION ===');
    console.log('Cookie jwt:', this.getCookie('jwt'));
    console.log('FormData object:', formData);
    console.log('FormData has estacion:', formData.has('estacion'));
    console.log('FormData has imagenes:', formData.has('imagenes'));

    const headers = this.getAuthHeadersForFormData();
    console.log('Headers being sent:', headers.keys());

    return this.http.post<Estacion>(this.apiUrl, formData, {
      headers,
      reportProgress: true
    });
  }

  actualizarEstacion(id: number, formData: FormData): Observable<Estacion> {
    // Debug: Verificar FormData y token
    console.log('=== ACTUALIZANDO ESTACION ===');
    console.log('Cookie jwt:', this.getCookie('jwt'));
    console.log('FormData object:', formData);
    console.log('FormData has estacion:', formData.has('estacion'));
    console.log('FormData has imagenes:', formData.has('imagenes'));

    const headers = this.getAuthHeadersForFormData();
    console.log('Headers being sent:', headers.keys());

    return this.http.put<Estacion>(`${this.apiUrl}/${id}`, formData, {
      headers,
      reportProgress: true
    });
  }

  asociarZonasAEstacion(estacionId: number, zonaIds: number[]): Observable<Estacion> {
    const headers = this.getAuthHeaders();
    return this.http.put<Estacion>(`${this.apiUrl}/${estacionId}/zonas`, zonaIds, { headers });
  }

  eliminarEstacion(id: number): Observable<string> {
    const headers = this.getAuthHeaders();
    return this.http.delete<string>(`${this.apiUrl}/${id}`, { headers });
  }
}
