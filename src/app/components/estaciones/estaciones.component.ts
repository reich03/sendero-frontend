import { Component, OnInit } from '@angular/core';
import { EstacionService } from '../../services/estacion.service';
import { MarkerService } from '../../services/marker.service';
import { Estacion } from '../../models/estacion.model';
import { Point } from '../../models/estacion.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-estaciones',
  templateUrl: './estaciones.component.html',
  styleUrls: ['./estaciones.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class EstacionesComponent implements OnInit {
  estaciones: Estacion[] = [];
  zonasDisponibles: Point[] = [];
  selectedZonas: number[] = [];
  selectedImages: File[] = [];
  isFormVisible = false;
  isEditing = false;
  loading = false;
  viewMode: 'cards' | 'table' = 'cards';
  newEstacion: Estacion = {
    id: 0,
    nombre: '',
    descripcion: '',
    imagenPortada: '',
    zonas: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    fechaCreacion: new Date().toISOString(),
  };

  constructor(
    private estacionService: EstacionService,
    private markerService: MarkerService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadEstaciones();
    this.loadZonas();

    const estacionId = this.route.snapshot.paramMap.get('id');
    if (estacionId) {
      this.loadEstacion(Number(estacionId));
    }
  }
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'cards' ? 'table' : 'cards';
  }

  get totalEstaciones(): number {
    return this.estaciones.length;
  }

  get estacionesConZonas(): number {
    return this.estaciones.filter((estacion) => estacion.zonas.length > 0)
      .length;
  }

  get vistaActual(): string {
    return this.viewMode === 'cards' ? 'Cards' : 'Tabla';
  }

  get isFormDisabled(): boolean {
    return this.loading || !this.newEstacion.nombre.trim();
  }

  get loadingText(): string {
    if (this.loading) return 'Procesando...';
    return this.isEditing ? 'Actualizar Estación' : 'Crear Estación';
  }
  formatDate(dateString: string): string {
    console.log('Formateando fecha:', dateString);
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  trackByEstacionId(index: number, estacion: Estacion): number {
    return estacion.id;
  }
  setViewMode(mode: 'cards' | 'table'): void {
    this.viewMode = mode;
  }
  loadEstaciones(): void {
    this.loading = true;
    this.estacionService.listarEstaciones().subscribe({
      next: (estaciones) => {
        console.log('=== DEBUG loadEstaciones ===');
        console.log('Estaciones recibidas:', estaciones);
        console.log('Número de estaciones:', estaciones.length);

        // Debuggear cada estación
        estaciones.forEach((estacion, index) => {
          console.log(`Estación ${index}:`, estacion);
          console.log(
            `- createdAt: ${estacion.createdAt} (${typeof estacion.createdAt})`
          );
          console.log(
            `- updatedAt: ${estacion.updatedAt} (${typeof estacion.updatedAt})`
          );
        });

        this.estaciones = estaciones;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando estaciones:', error);
        this.loading = false;
      },
    });
  }

  getDescriptionPreview(description: string, maxLength: number = 100): string {
    if (!description) return 'Sin descripción';
    return description.length > maxLength
      ? description.substring(0, maxLength) + '...'
      : description;
  }
  loadEstacion(id: number): void {
    this.estacionService.obtenerEstacion(id).subscribe({
      next: (estacion) => {
        this.newEstacion = { ...estacion };
        this.selectedZonas = estacion.zonas.map((zona) => zona.id);
        this.isFormVisible = true;
        this.isEditing = true;
      },
      error: (error) => {
        console.error('Error cargando estación:', error);
      },
    });
  }

  loadZonas(): void {
    this.markerService.getMarkers().subscribe({
      next: (zonas) => {
        this.zonasDisponibles = zonas;
      },
      error: (error) => {
        console.error('Error cargando zonas:', error);
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
    this.newEstacion = {
      id: 0,
      nombre: '',
      descripcion: '',
      imagenPortada: '',
      zonas: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      fechaCreacion: new Date().toISOString(),
    };
    this.selectedZonas = [];
    this.selectedImages = [];
  }

  editEstacion(estacion: Estacion): void {
    this.newEstacion = { ...estacion };
    this.selectedZonas = estacion.zonas.map((zona) => zona.id);
    this.isFormVisible = true;
    this.isEditing = true;
  }

  // AGREGAR este método al inicio de la clase EstacionesComponent:
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

  // REEMPLAZAR el método createEstacion():
  createEstacion(): void {
    if (!this.newEstacion.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    // Verificar que tenemos token en cookies antes de intentar
    const token = this.getCookie('jwt');
    if (!token) {
      alert(
        'No se encontró token de autenticación. Por favor, inicia sesión de nuevo.'
      );
      return;
    }

    this.loading = true;
    const formData = this.buildFormData();

    this.estacionService.crearEstacion(formData).subscribe({
      next: (estacionCreada) => {
        console.log('Estación creada exitosamente:', estacionCreada);

        // Si hay zonas seleccionadas, asociarlas
        if (this.selectedZonas.length > 0) {
          this.associateZonas(estacionCreada.id);
        } else {
          this.loading = false;
          this.loadEstaciones();
          this.hideForm();
          alert('Estación creada exitosamente');
        }
      },
      error: (error) => {
        console.error('Error completo creando estación:', error);
        this.loading = false;

        let errorMessage = 'Error desconocido';

        if (error.status === 403) {
          errorMessage = 'Error de autorización. Verifica tu sesión.';
        } else if (error.status === 415) {
          errorMessage =
            'Error de tipo de contenido. Problema con el formato de datos.';
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        alert('Error al crear la estación: ' + errorMessage);
      },
    });
  }

  // REEMPLAZAR el método updateEstacion():
  updateEstacion(): void {
    if (!this.newEstacion.nombre.trim()) {
      alert('El nombre es requerido');
      return;
    }

    // Verificar que tenemos token en cookies antes de intentar
    const token = this.getCookie('jwt');
    if (!token) {
      alert(
        'No se encontró token de autenticación. Por favor, inicia sesión de nuevo.'
      );
      return;
    }

    this.loading = true;
    const formData = this.buildFormData();

    this.estacionService
      .actualizarEstacion(this.newEstacion.id, formData)
      .subscribe({
        next: (estacionActualizada) => {
          console.log(
            'Estación actualizada exitosamente:',
            estacionActualizada
          );
          this.associateZonas(estacionActualizada.id);
        },
        error: (error) => {
          console.error('Error completo actualizando estación:', error);
          this.loading = false;

          let errorMessage = 'Error desconocido';

          if (error.status === 403) {
            errorMessage = 'Error de autorización. Verifica tu sesión.';
          } else if (error.status === 415) {
            errorMessage =
              'Error de tipo de contenido. Problema con el formato de datos.';
          } else if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }

          alert('Error al actualizar la estación: ' + errorMessage);
        },
      });
  }

  // REEMPLAZAR el método testTokenAndFormData():
  testTokenAndFormData(): void {
    console.log('=== TEST DE TOKEN Y FORMDATA ===');

    // Test 1: Verificar token en cookies
    const token = this.getCookie('jwt');
    console.log('1. Token JWT en cookies:', token);
    console.log('2. Token es válido:', !!token);
    console.log('3. Todas las cookies:', document.cookie);

    if (token) {
      const bearerToken = token.startsWith('Bearer ')
        ? token
        : `Bearer ${token}`;
      console.log('4. Bearer token:', bearerToken);
    }

    // Test 2: Crear FormData de prueba
    this.newEstacion.nombre = 'Test Estacion';
    this.newEstacion.descripcion = 'Test Description';

    const testFormData = this.buildFormData();
    console.log('5. FormData creado:', testFormData);
    console.log('6. FormData.has("estacion"):', testFormData.has('estacion'));

    // Test 3: Verificar servicios
    console.log('7. EstacionService disponible:', !!this.estacionService);

    console.log('===============================');

    // Resetear
    this.resetForm();
  }

  deleteEstacion(id: number, nombre: string): void {
    if (
      confirm(`¿Estás seguro de que quieres eliminar la estación "${nombre}"?`)
    ) {
      this.loading = true;
      this.estacionService.eliminarEstacion(id).subscribe({
        next: () => {
          console.log('Estación eliminada');
          this.loadEstaciones();
        },
        error: (error) => {
          console.error('Error eliminando estación:', error);
          this.loading = false;
          alert('Error al eliminar la estación');
        },
      });
    }
  }

  associateZonas(estacionId: number): void {
    if (this.selectedZonas.length === 0) {
      this.loading = false;
      this.loadEstaciones();
      this.hideForm();
      return;
    }

    this.estacionService
      .asociarZonasAEstacion(estacionId, this.selectedZonas)
      .subscribe({
        next: () => {
          console.log('Zonas asociadas correctamente');
          this.loading = false;
          this.loadEstaciones();
          this.hideForm();
        },
        error: (error) => {
          console.error('Error asociando zonas:', error);
          this.loading = false;
          alert('Error al asociar zonas');
        },
      });
  }

  buildFormData(): FormData {
    const formData = new FormData();

    // Crear objeto con los datos de la estación (sin las zonas)
    const estacionData = {
      nombre: this.newEstacion.nombre.trim(),
      descripcion: this.newEstacion.descripcion.trim(),
    };

    // Debug inicial
    console.log('=== CONSTRUYENDO FORM DATA ===');
    console.log('Estacion data:', estacionData);
    console.log(
      'Número de imágenes seleccionadas:',
      this.selectedImages?.length || 0
    );

    // Crear un Blob con el JSON para asegurar el content-type correcto
    const estacionBlob = new Blob([JSON.stringify(estacionData)], {
      type: 'application/json',
    });

    formData.append('estacion', estacionBlob);
    console.log('✓ Agregado estacion como Blob');

    // Agregar imágenes si existen
    if (this.selectedImages && this.selectedImages.length > 0) {
      this.selectedImages.forEach((image, index) => {
        console.log(
          `✓ Agregando imagen ${index + 1}: ${image.name} (${image.size} bytes)`
        );
        formData.append('imagenes', image, image.name);
      });
    } else {
      console.log('ℹ No hay imágenes para agregar');
    }

    // Verificar que FormData se construyó correctamente
    console.log('FormData final:');
    console.log('- Tiene estacion:', formData.has('estacion'));
    console.log('- Tiene imagenes:', formData.has('imagenes'));
    console.log('===============================');

    return formData;
  }

  onImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedImages = Array.from(input.files);
    }
  }

  // Métodos para manejar checkboxes de zonas
  isZonaSelected(zonaId: number): boolean {
    return this.selectedZonas.includes(zonaId);
  }

  onZonaChange(zonaId: number, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.selectedZonas.includes(zonaId)) {
        this.selectedZonas.push(zonaId);
      }
    } else {
      this.selectedZonas = this.selectedZonas.filter((id) => id !== zonaId);
    }
  }

  getZonasNames(zonas: Point[]): string {
    return zonas.map((zona) => zona.title).join(', ');
  }

  // Método de test para debugging
}
