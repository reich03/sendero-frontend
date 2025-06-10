import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstacionService } from '../../services/estacion.service';
import { Estacion } from '../../models/estacion.model';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class LandingComponent implements OnInit {
  showMobileMenu = false;
  estacionesDestacadas: Estacion[] = [];
  loading = true;

  constructor(private estacionService: EstacionService) {}

  ngOnInit(): void {
    this.loadEstacionesDestacadas();
  }

  toggleMobileMenu(): void {
    this.showMobileMenu = !this.showMobileMenu;
  }

  loadEstacionesDestacadas(): void {
    this.loading = true;
    this.estacionService.listarEstaciones().subscribe({
      next: (estaciones) => {
        this.estacionesDestacadas = estaciones.slice(0, 3);
        this.loading = false;
        console.log('Estaciones destacadas:', this.estacionesDestacadas);
      },
      error: (error) => {
        console.error('Error cargando estaciones destacadas:', error);
        this.loading = false;
      },
    });
  }

  getDescriptionPreview(description: string, maxLength: number = 100): string {
    if (!description)
      return 'Descubre los puntos de interés y eventos de esta estación';
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }
}
