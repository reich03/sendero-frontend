import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EstacionService } from '../../services/estacion2.service';
import { EventoService } from '../../services/evento.service';
import { Estacion, Zona } from '../../models/estacion2.model';
import { Evento } from '../../models/evento.model';

@Component({
  selector: 'app-estacion-detalle',
  templateUrl: './estacion-detalle.component.html',
  styleUrls: ['./estacion-detalle.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class EstacionDetalleComponent implements OnInit {
  estacion: Estacion | null = null;
  eventos: Evento[] = [];
  loading = true;
  error = false;
  estacionId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private estacionService: EstacionService,
    private eventoService: EventoService
  ) {}

  ngOnInit(): void {
    this.estacionId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.estacionId) {
      this.loadEstacionData();
    } else {
      this.error = true;
      this.loading = false;
    }
  }

 loadEstacionData(): void {
  this.loading = true;
  this.estacionService.obtenerEstacion(this.estacionId).subscribe({
    next: (estacion) => {
      this.estacion = estacion;

      // Verificar si 'usuarioCreador' está presente, si no, asignar valores por defecto
      if (this.estacion && !this.estacion.usuarioCreador) {
        this.estacion.usuarioCreador = {
          id: 0,
          username: 'Desconocido',
          password: '',
          email: '',
          role: 'invitado',
        };
      }

      console.log('Estación cargada:', estacion);
      this.loadEventos();
    },
    error: (error) => {
      console.error('Error cargando estación:', error);
      this.error = true;
      this.loading = false;
    },
  });
}


  loadEventos(): void {
    // Cargar todos los eventos y filtrar por esta estación
    this.eventoService.listarEventos().subscribe({
      next: (eventos) => {
        this.eventos = eventos.filter(
          (evento) => evento.estacion.id === this.estacionId
        );
        console.log('Eventos de la estación:', this.eventos);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.eventos = [];
        this.loading = false;
      },
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';

    try {
      const fecha = new Date(dateString);
      return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  }

  // Corregir el método para usar la estructura correcta de datos
  getZonasByType(type: string): Zona[] {
    if (!this.estacion?.zonas) return [];
    return this.estacion.zonas.filter(
      (zona) => zona.tipo?.toLowerCase() === type.toLowerCase()
    );
  }

  // Método helper para obtener la primera imagen de una zona
  getZonaImageUrl(zona: Zona): string {
    if (zona.imagenes && zona.imagenes.length > 0) {
      return 'http://localhost:8092' + zona.imagenes[0];
    }
    return '../../../assets/imagen-animal.jpg';
  }

  // Método helper para obtener el tipo de zona en formato lowercase
  getZonaTypeLowercase(zona: Zona): string {
    return zona.tipo?.toLowerCase() || '';
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  goToMap(): void {
    this.router.navigate(['/map']);
  }
}
