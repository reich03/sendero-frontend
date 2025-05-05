// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

interface User {
  email: string;
  username?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isAuthenticated = new BehaviorSubject<boolean>(false);
  private currentUser = new BehaviorSubject<User | null>(null);

  constructor(private router: Router) {
    // Verificar si hay un usuario en localStorage al iniciar
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      this.currentUser.next(JSON.parse(storedUser));
      this.isAuthenticated.next(true);
    }
  }

  login(email: string, password: string): boolean {
    // Aquí normalmente harías una llamada HTTP a tu backend
    // Simulamos una autenticación exitosa si el password no está vacío
    if (email && password) {
      const user = { email };
      localStorage.setItem('currentUser', JSON.stringify(user));
      this.currentUser.next(user);
      this.isAuthenticated.next(true);
      return true;
    }
    return false;
  }

  register(username: string, email: string, password: string, confirmPassword: string): boolean {
    // Validaciones básicas
    if (!username || !email || !password || password !== confirmPassword) {
      return false;
    }

    // Aquí harías una llamada HTTP a tu backend
    // Simulamos un registro exitoso
    const user = { email, username };
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUser.next(user);
    this.isAuthenticated.next(true);
    return true;
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUser.next(null);
    this.isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn() {
    return this.isAuthenticated.asObservable();
  }

  getCurrentUser() {
    return this.currentUser.asObservable();
  }
}
