import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService, AuditLog } from '../../services/audit.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css']
})

export class AuditComponent implements OnInit {
  darkMode = false;
  logs: AuditLog[] = [];
  filteredLogs: AuditLog[] = [];
  fechaDesde: string = '';
  fechaHasta: string = '';

  constructor(private auditService: AuditService) {}

  ngOnInit(): void {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    this.darkMode = savedDarkMode;
    if (this.darkMode) document.documentElement.classList.add('dark');

    this.getAuditLogs();
  }

  getAuditLogs(): void {
    this.auditService.getAllLogs().subscribe((data) => {
      this.logs = data;
      this.filteredLogs = [...data];
    });
  }

  toggleDarkMode(): void {
    this.darkMode = !this.darkMode;
    const root = document.documentElement;
    this.darkMode ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('darkMode', this.darkMode ? 'true' : 'false');
  }

  filtrarPorFecha(): void {
    if (!this.fechaDesde && !this.fechaHasta) {
      this.filteredLogs = [...this.logs];
      return;
    }

    // Convertir fechas a objetos Date
    const desde = this.fechaDesde ? new Date(this.fechaDesde) : new Date(0);
    const hasta = this.fechaHasta ? new Date(this.fechaHasta) : new Date();

    // Ajustar la fecha "hasta" para incluir todo el día
    hasta.setHours(23, 59, 59, 999);

    this.filteredLogs = this.logs.filter((log) => {
      const fechaLog = new Date(log.timestamp);
      return fechaLog >= desde && fechaLog <= hasta;
    });
  }

  limpiarFiltros(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.filteredLogs = [...this.logs];
  }

  // Método para formatear la fecha considerando el formato "mes/día/año, hora:minuto AM/PM"
  formatDate(dateString: string): string {
    const date = new Date(dateString);

    // Verificamos si la fecha es válida
    if (isNaN(date.getTime())) {
      return dateString; // Devolvemos el string original si no es una fecha válida
    }

    // Opciones para formatear la fecha y hora de manera más legible
    return new Intl.DateTimeFormat('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  }

  // Método para formatear fecha corta (para el widget de estadísticas)
  formatShortDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(date);
  }

  // Método para obtener iniciales del nombre de usuario
  getInitials(username: string): string {
    if (!username) return '?';

    const parts = username.split(/[\s._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }

    return username.substring(0, 2).toUpperCase();
  }

  // Contar usuarios únicos para las estadísticas
  countUniqueUsers(): number {
    const uniqueUsers = new Set<string>();
    this.filteredLogs.forEach(log => {
      if (log.username) {
        uniqueUsers.add(log.username);
      }
    });
    return uniqueUsers.size;
  }
}
