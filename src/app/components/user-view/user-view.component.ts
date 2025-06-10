import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  favoriteZones?: FavoriteZone[];
}

interface FavoriteZone {
  id: number;
  name: string;
  description: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

@Component({
  selector: 'app-user-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-view.component.html',
  styleUrls: ['./user-view.component.css']
})
export class UserViewComponent implements OnInit {
  currentUser: User | null = null;  // This will store the user data from cookies
  darkMode = false;

  editMode = false;

  mockFavoriteZones: FavoriteZone[] = [
    { id: 1, name: 'Parque Central', description: 'Área recreativa', coordinates: { lat: 14.1236, lng: -87.4567 } },
    { id: 2, name: 'Centro Comercial', description: 'Zona de compras', coordinates: { lat: 14.1283, lng: -87.4514 } },
    { id: 3, name: 'Mirador Las Lomas', description: 'Vista panorámica', coordinates: { lat: 14.1325, lng: -87.4611 } }
  ];

  constructor() { }

  ngOnInit(): void {
    // Get the current user from the cookie
    const cookieData = this.getCookie('current_user');
    if (cookieData) {
      try {
        this.currentUser = JSON.parse(cookieData);
      } catch (e) {
        console.error('Error al parsear la cookie currentUser', e);
      }
    }

    // Default user if no cookie found
    if (!this.currentUser) {
      this.currentUser = {
        id: 0,
        username: 'Invitado',
        email: 'No disponible',
        role: 'Invitado',
        favoriteZones: []  // Default empty zones
      };
    }

    // Check dark mode preference from local storage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }

  // Function to get a cookie by name
  getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  saveProfile(): void {
    this.editMode = false;
    if (this.currentUser) {
      document.cookie = `current_user=${JSON.stringify(this.currentUser)}; path=/; max-age=86400`;
    }
    alert('Perfil actualizado correctamente');
  }

  viewZoneOnMap(zone: FavoriteZone): void {
    console.log('Visualizando zona en el mapa:', zone);
  }

  addNewZone(): void {
    console.log('Añadiendo nueva zona favorita');
  }
}
