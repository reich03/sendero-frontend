import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule],

  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],

})
export class UsersComponent implements OnInit {
  darkMode = false;

  // Datos de ejemplo para la tabla
  mockUsers = [
    { name: 'Juan Pérez', email: 'juan@ejemplo.com', role: 'Admin', status: 'Activo', lastLogin: '10 min. atrás' },
    { name: 'María López', email: 'maria@ejemplo.com', role: 'Editor', status: 'Activo', lastLogin: '2 horas atrás' },
    { name: 'Carlos Sánchez', email: 'carlos@ejemplo.com', role: 'Usuario', status: 'Inactivo', lastLogin: '1 día atrás' },
    { name: 'Ana Martínez', email: 'ana@ejemplo.com', role: 'Editor', status: 'Pendiente', lastLogin: '3 días atrás' },
    { name: 'Roberto González', email: 'roberto@ejemplo.com', role: 'Usuario', status: 'Activo', lastLogin: '1 semana atrás' },
  ];

  ngOnInit() {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;

    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    }
  }


  toggleDarkMode() {
    this.darkMode = !this.darkMode;

    // Aplicar clases al elemento HTML para el modo oscuro
    if (this.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Guardar preferencia en localStorage
    localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
  }

}
