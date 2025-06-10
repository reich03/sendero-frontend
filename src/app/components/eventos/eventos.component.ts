import { Component, OnInit } from '@angular/core';
import { EventoService } from '../../services/evento.service';
import { EstacionService } from '../../services/estacion.service';
import { Evento, EventoRequest } from '../../models/evento.model';
import { Estacion } from '../../models/estacion.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class EventosComponent implements OnInit {
  eventos: Evento[] = [];
  estacionesDisponibles: Estacion[] = [];
  isFormVisible = false;
  isEditing = false;
  loading = false;
  viewMode: 'cards' | 'table' = 'cards';

  newEvento: EventoRequest = {
    nombre: '',
    descripcion: '',
    fechaEvento: '',
    estacionId: 0,
    usuarioId: 0,
  };

  constructor(
    private eventoService: EventoService,
    private estacionService: EstacionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEventos();
    this.loadEstaciones();

    const eventoId = this.route.snapshot.paramMap.get('id');
    if (eventoId) {
      this.loadEvento(Number(eventoId));
    }
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  private getCurrentUser(): any {
  const userCookie = this.getCookie('current_user');
  console.log('User cookie (raw):', userCookie);

  if (!userCookie) {
    return null;
  }

  try {
    const decodedCookie = decodeURIComponent(userCookie);
    console.log('User cookie (decoded):', decodedCookie);

    const user = JSON.parse(decodedCookie);
    console.log('User parsed:', user);

    return user;
  } catch (error) {
    console.error('Error parsing user cookie:', error);
    return null;
  }
}
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  get totalEventos(): number {
    return this.eventos.length;
  }

  get vistaActual(): string {
    return this.viewMode === 'cards' ? 'Cards' : 'Tabla';
  }

  get isFormDisabled(): boolean {
    return (
      this.loading ||
      !this.newEvento.nombre.trim() ||
      !this.newEvento.fechaEvento ||
      this.newEvento.estacionId === 0
    );
  }
  // Método para debugging - agrégalo temporalmente
  debugForm(): void {
    console.log('=== DEBUG FORMULARIO ===');
    console.log('newEvento completo:', this.newEvento);
    console.log(
      'nombre:',
      `"${this.newEvento.nombre}" (tipo: ${typeof this.newEvento.nombre})`
    );
    console.log(
      'nombre.trim():',
      `"${this.newEvento.nombre.trim()}" (length: ${
        this.newEvento.nombre.trim().length
      })`
    );
    console.log(
      'fechaEvento:',
      `"${this.newEvento.fechaEvento}" (tipo: ${typeof this.newEvento
        .fechaEvento})`
    );
    console.log(
      'estacionId:',
      `${this.newEvento.estacionId} (tipo: ${typeof this.newEvento.estacionId})`
    );
    console.log('loading:', this.loading);

    // Validaciones individuales
    console.log('¿loading?', this.loading);
    console.log('¿nombre vacío?', !this.newEvento.nombre.trim());
    console.log('¿fecha vacía?', !this.newEvento.fechaEvento);
    console.log('¿estación no seleccionada?', this.newEvento.estacionId === 0);

    console.log('isFormDisabled:', this.isFormDisabled);
    console.log('========================');
  }
  get loadingText(): string {
    if (this.loading) return 'Procesando...';
    return this.isEditing ? 'Actualizar Evento' : 'Crear Evento';
  }
  trackByEventoId(index: number, evento: Evento): number {
    return evento.id;
  }

  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
  }
  formatDate(dateString: string): string {
    if (!dateString) return 'Fecha no disponible';

    try {
      const fecha = new Date(dateString);
      if (isNaN(fecha.getTime())) return 'Fecha inválida';

      return fecha.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Error en fecha';
    }
  }

  loadEventos(): void {
    this.loading = true;
    this.eventoService.listarEventos().subscribe({
      next: (eventos) => {
        console.log('Eventos recibidos:', eventos);
        this.eventos = eventos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando eventos:', error);
        this.loading = false;
      },
    });
  }

  loadEstaciones(): void {
    this.estacionService.listarEstaciones().subscribe({
      next: (estaciones) => {
        this.estacionesDisponibles = estaciones;
        console.log('Estaciones disponibles:', estaciones);
      },
      error: (error) => {
        console.error('Error cargando estaciones:', error);
      },
    });
  }

  loadEvento(id: number): void {
    this.eventoService.obtenerEvento(id).subscribe({
      next: (evento) => {
        console.log('Evento cargado:', evento);
        this.newEvento = {
          nombre: evento.nombre,
          descripcion: evento.descripcion,
          fechaEvento: evento.fechaEvento,
          estacionId: evento.estacion.id,
          usuarioId: evento.usuarioCreador.id,
        };
        this.isFormVisible = true;
        this.isEditing = true;
      },

      error: (error) => {
        console.error('Error cargando evento:', error);
      },
    });
  }

  showForm(): void {
    this.isFormVisible = true;
    this.isEditing = false;
    this.resetForm();
  }

  hideForm(): void {
    this.isFormVisible = false;
    this.resetForm();
  }

  resetForm(): void {
    this.newEvento = {
      nombre: '',
      descripcion: '',
      fechaEvento: '',
      estacionId: 0,
      usuarioId: 0,
    };
  }

  editEvento(evento: Evento): void {
    this.newEvento = {
      nombre: evento.nombre,
      descripcion: evento.descripcion,
      fechaEvento: evento.fechaEvento,
      estacionId: evento.estacion.id,
      usuarioId: this.getCurrentUser()?.id || 0,
    };
    this.isFormVisible = true;
    this.isEditing = true;
  }

  createEvento(): void {
    if (
      !this.newEvento.nombre.trim() ||
      !this.newEvento.fechaEvento ||
      this.newEvento.estacionId === 0
    ) {
      alert('Todos los campos son requeridos');
      return;
    }

    // Obtener usuario actual
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      alert('Error: No se pudo obtener información del usuario');
      return;
    }

    this.loading = true;

    // Crear request con usuarioId
    const eventoRequest: EventoRequest = {
      ...this.newEvento,
      usuarioId: currentUser.id,
      estacionId: Number(this.newEvento.estacionId), // Asegurar que sea número
    };

    console.log('Enviando evento:', eventoRequest);

    this.eventoService.crearEvento(eventoRequest).subscribe({
      next: (eventoCreado) => {
        console.log('Evento creado exitosamente:', eventoCreado);
        this.loading = false;
        this.loadEventos();
        this.hideForm();
        alert('Evento creado exitosamente');
      },
      error: (error) => {
        console.error('Error creando evento:', error);
        this.loading = false;
        alert(
          'Error al crear el evento: ' + (error.error?.message || error.message)
        );
      },
    });
  }

  updateEvento(): void {
    if (
      !this.newEvento.nombre.trim() ||
      !this.newEvento.fechaEvento ||
      this.newEvento.estacionId === 0
    ) {
      alert('Todos los campos son requeridos');
      return;
    }

    this.loading = true;

    // Necesitarías el ID del evento que estás editando
    const eventoId = this.eventos.find(
      (e) =>
        e.nombre === this.newEvento.nombre &&
        e.estacion.id === this.newEvento.estacionId
    )?.id;

    if (!eventoId) {
      alert('Error: No se pudo determinar el ID del evento');
      this.loading = false;
      return;
    }

    this.eventoService.actualizarEvento(eventoId, this.newEvento).subscribe({
      next: (eventoActualizado) => {
        console.log('Evento actualizado exitosamente:', eventoActualizado);
        this.loading = false;
        this.loadEventos();
        this.hideForm();
        alert('Evento actualizado exitosamente');
      },
      error: (error) => {
        console.error('Error actualizando evento:', error);
        this.loading = false;
        alert(
          'Error al actualizar el evento: ' +
            (error.error?.message || error.message)
        );
      },
    });
  }

  deleteEvento(id: number, nombre: string): void {
    if (
      confirm(`¿Estás seguro de que quieres eliminar el evento "${nombre}"?`)
    ) {
      this.loading = true;
      this.eventoService.eliminarEvento(id).subscribe({
        next: () => {
          console.log('Evento eliminado');
          this.loadEventos();
        },
        error: (error) => {
          console.error('Error eliminando evento:', error);
          this.loading = false;
          alert('Error al eliminar el evento');
        },
      });
    }
  }

  getEstacionNombre(estacionId: number): string {
    const estacion = this.estacionesDisponibles.find(
      (e) => e.id === estacionId
    );
    return estacion ? estacion.nombre : 'Estación no encontrada';
  }

  getDescriptionPreview(description: string, maxLength: number = 100): string {
    if (!description) return 'Sin descripción';
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }
}
