// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { CookieService } from 'ngx-cookie-service';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8092/api/users';
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'current_user';

  private authSubject = new BehaviorSubject<boolean>(this.hasValidToken());
  public isAuthenticated = this.authSubject.asObservable();

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromCookie());
  public currentUser = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, {
      username,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.token);
        this.authSubject.next(true);
        // Fetch user data after successful login
        this.fetchCurrentUser().subscribe();
      }),
      map(() => true),
      catchError(error => {
        console.error('Login error:', error);
        return throwError(() => new Error(error.error?.message || 'Error en el inicio de sesión'));
      })
    );
  }

  register(username: string, email: string, password: string): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, {
      username,
      email,
      password
    }).pipe(
      tap(response => {
        this.setToken(response.token);
        this.authSubject.next(true);
        // Fetch user data after successful registration
        this.fetchCurrentUser().subscribe();
      }),
      map(() => true),
      catchError(error => {
        console.error('Registration error:', error);
        return throwError(() => new Error(error.error?.message || 'Error en el registro'));
      })
    );
  }

  fetchCurrentUser(): Observable<User> {
    if (!this.getToken()) {
      return throwError(() => new Error('No token available'));
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}`
    });

    return this.http.get<User>(`${this.API_URL}/me`, { headers }).pipe(
      tap(user => {
        this.setUserInCookie(user);
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Error fetching user data:', error);
        // If unauthorized, logout
        if (error.status === 401) {
          this.logout();
        }
        return throwError(() => new Error('Error al obtener información del usuario'));
      })
    );
  }

  logout(): void {
    this.cookieService.delete(this.TOKEN_KEY);
    this.cookieService.delete(this.USER_KEY);
    this.authSubject.next(false);
    this.currentUserSubject.next(null);
  }

  getToken(): string {
    return this.cookieService.get(this.TOKEN_KEY);
  }

  private setToken(token: string): void {
    // Set cookie with secure flags, expiring in 1 day
    this.cookieService.set(this.TOKEN_KEY, token, 1, '/', undefined, true, 'Strict');
  }

  private getUserFromCookie(): User | null {
    const userJson = this.cookieService.get(this.USER_KEY);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (error) {
        console.error('Error parsing user data from cookie:', error);
      }
    }
    return null;
  }

  private setUserInCookie(user: User): void {
    this.cookieService.set(this.USER_KEY, JSON.stringify(user), 1, '/', undefined, true, 'Strict');
  }

  private hasValidToken(): boolean {
    return !!this.cookieService.get(this.TOKEN_KEY);
  }
}
