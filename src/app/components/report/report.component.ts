import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { AuditService } from '../../services/audit.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ZonaVisitadaResponse {
  zona: {
    id: number;
    nombre: string;
    tipo: string;
    descripcion: string;
    latitud: number;
    longitud: number;
    imagenes: string[];
    creadoPor: string;
    fechaCreacion: string;
    comentarios: string[];
  };
  log: {
    id: number;
    username: string;
    action: string;
    entity: string;
    entityId: string;
    details: string;
    timestamp: string;
  };
}

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe]
})
export class ReportComponent implements OnInit {
  @ViewChild('reportContent') reportContent!: ElementRef;

  zonasVisitadas: ZonaVisitadaResponse[] = [];
  filteredZonas: ZonaVisitadaResponse[] = [];

  // Filtros
  startDate: string = '';
  endDate: string = '';
  selectedTipo: string = '';
  searchQuery: string = '';

  // Estadísticas
  totalVisitas: number = 0;
  visitasPorTipo: {[key: string]: number} = {};
  visitasPorUsuario: {[key: string]: number} = {};

  // Visualización
  viewMode: 'cards' | 'table' = 'cards';
  sortField: string = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Paginación
  currentPage: number = 1;
  itemsPerPage: number = 6;

  // Para PDF
  isGeneratingPDF: boolean = false;

  constructor(private auditService: AuditService) { }

  ngOnInit(): void {
    this.loadZonasVisitadas();
  }

  loadZonasVisitadas() {
    this.auditService.getZonasVisitadas().subscribe(data => {
      this.zonasVisitadas = data;
      this.applyFilters();
      this.calcularEstadisticas();
    });
  }

  applyFilters() {
    let result = [...this.zonasVisitadas];

    // Filtro por fecha
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      end.setHours(23, 59, 59); // Incluir todo el día final

      result = result.filter(item => {
        const timestamp = new Date(item.log.timestamp);
        return timestamp >= start && timestamp <= end;
      });
    }

    // Filtro por tipo
    if (this.selectedTipo) {
      result = result.filter(item => item.zona.tipo === this.selectedTipo);
    }

    // Búsqueda por texto
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(item =>
        item.zona.nombre.toLowerCase().includes(query) ||
        item.zona.descripcion.toLowerCase().includes(query) ||
        item.log.username.toLowerCase().includes(query) ||
        item.log.details.toLowerCase().includes(query)
      );
    }

    // Ordenar resultados
    result.sort((a, b) => {
      let fieldA, fieldB;

      if (this.sortField === 'timestamp') {
        fieldA = new Date(a.log.timestamp).getTime();
        fieldB = new Date(b.log.timestamp).getTime();
      } else if (this.sortField === 'nombre') {
        fieldA = a.zona.nombre;
        fieldB = b.zona.nombre;
      } else if (this.sortField === 'tipo') {
        fieldA = a.zona.tipo;
        fieldB = b.zona.tipo;
      } else if (this.sortField === 'username') {
        fieldA = a.log.username;
        fieldB = b.log.username;
      }

      // Comprobar si alguno de los campos es undefined
      if (fieldA === undefined || fieldB === undefined) {
        return 0; // Devuelve 0 si alguno de los campos no está definido
      }

      if (this.sortDirection === 'asc') {
        return fieldA > fieldB ? 1 : -1;
      } else {
        return fieldA < fieldB ? 1 : -1;
      }
    });

    this.filteredZonas = result;
    this.totalVisitas = result.length;
  }

  calcularEstadisticas() {
    // Reiniciar estadísticas
    this.visitasPorTipo = {};
    this.visitasPorUsuario = {};

    // Calcular estadísticas basadas en los datos filtrados
    this.filteredZonas.forEach(item => {
      // Conteo por tipo
      const tipo = item.zona.tipo;
      this.visitasPorTipo[tipo] = (this.visitasPorTipo[tipo] || 0) + 1;

      // Conteo por usuario
      const usuario = item.log.username;
      this.visitasPorUsuario[usuario] = (this.visitasPorUsuario[usuario] || 0) + 1;
    });
  }

  changeViewMode(mode: 'cards' | 'table') {
    this.viewMode = mode;
  }

  changeSorting(field: string) {
    if (this.sortField === field) {
      // Cambiar dirección si es el mismo campo
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Nuevo campo, establecer dirección predeterminada
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  get paginatedItems() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredZonas.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.filteredZonas.length / this.itemsPerPage);
  }

  get pages() {
    const pages = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  exportToCSV() {
    // Crear encabezados para el CSV
    const headers = ['Nombre', 'Tipo', 'Descripción', 'Usuario', 'Acción', 'Detalles', 'Fecha'];

    // Crear filas con los datos
    const rows = this.filteredZonas.map(item => [
      item.zona.nombre,
      item.zona.tipo,
      item.zona.descripcion,
      item.log.username,
      item.log.action,
      item.log.details,
      new Date(item.log.timestamp).toLocaleString()
    ]);

    // Crear contenido CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Crear un Blob con el contenido CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Crear un link para descargar
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_zonas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Crea y descarga un PDF de la tabla de datos
   */
  exportToPDF() {
    this.isGeneratingPDF = true;

    // Cambiar temporalmente a vista de tabla si no está ya en ella
    const originalViewMode = this.viewMode;
    this.viewMode = 'table';

    // Mostrar todos los elementos temporalmente (sin paginación)
    const originalItemsPerPage = this.itemsPerPage;
    this.itemsPerPage = this.filteredZonas.length;

    // Darle tiempo al DOM para actualizarse
    setTimeout(() => {
      // Crear un elemento temporal para renderizar el contenido PDF
      const pdfContent = document.createElement('div');
      pdfContent.className = 'pdf-content';

      // Crear y añadir el encabezado
      const header = document.createElement('div');
      header.innerHTML = `
        <h1 style="text-align: center; color: #4338ca; margin-bottom: 10px;">Reporte de Zonas Visitadas</h1>
        <p style="text-align: center; color: #6b7280; margin-bottom: 20px;">
          Fecha: ${new Date().toLocaleDateString()} | Total: ${this.totalVisitas} registros
        </p>
      `;
      pdfContent.appendChild(header);

      // Crear contenedor para la tabla
      const tableContainer = document.createElement('div');

      // Crear la tabla para el PDF
      const table = document.createElement('table');
      table.style.width = '100%';
      table.style.borderCollapse = 'collapse';
      table.style.marginBottom = '20px';

      // Añadir encabezados
      const thead = document.createElement('thead');
      thead.innerHTML = `
        <tr style="background-color: #f3f4f6; border-bottom: 2px solid #d1d5db;">
          <th style="padding: 10px; text-align: left; font-weight: bold;">Nombre</th>
          <th style="padding: 10px; text-align: left; font-weight: bold;">Tipo</th>
          <th style="padding: 10px; text-align: left; font-weight: bold;">Usuario</th>
          <th style="padding: 10px; text-align: left; font-weight: bold;">Acción</th>
          <th style="padding: 10px; text-align: left; font-weight: bold;">Fecha</th>
        </tr>
      `;
      table.appendChild(thead);

      // Añadir datos
      const tbody = document.createElement('tbody');
      this.filteredZonas.forEach((item, index) => {
        const row = document.createElement('tr');
        row.style.borderBottom = '1px solid #e5e7eb';
        row.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f9fafb';

        row.innerHTML = `
          <td style="padding: 8px;">${item.zona.nombre}</td>
          <td style="padding: 8px;">
            <span style="
              background-color: ${item.zona.tipo === 'FAUNA' ? '#dbeafe' : '#dcfce7'};
              color: ${item.zona.tipo === 'FAUNA' ? '#1e40af' : '#166534'};
              padding: 2px 8px;
              border-radius: 9999px;
              font-size: 12px;
            ">${item.zona.tipo}</span>
          </td>
          <td style="padding: 8px;">${item.log.username}</td>
          <td style="padding: 8px;">${item.log.action}</td>
          <td style="padding: 8px;">${new Date(item.log.timestamp).toLocaleString()}</td>
        `;

        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      tableContainer.appendChild(table);
      pdfContent.appendChild(tableContainer);

      // Añadir estadísticas
      const statsSection = document.createElement('div');
      statsSection.style.marginTop = '20px';
      statsSection.style.pageBreakBefore = 'always';
      statsSection.innerHTML = `
        <h2 style="color: #4338ca; margin-bottom: 10px;">Estadísticas</h2>
        <div style="display: flex; margin-bottom: 20px;">
          <div style="flex: 1; padding: 10px; background-color: #f9fafb; border-radius: 8px; margin-right: 10px;">
            <h3 style="margin-bottom: 10px;">Visitas por Tipo</h3>
            <div>
              ${Object.entries(this.visitasPorTipo).map(([tipo, cantidad]) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 500;">${tipo}</span>
                  <span style="font-weight: 600;">${cantidad}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div style="flex: 1; padding: 10px; background-color: #f9fafb; border-radius: 8px; margin-left: 10px;">
            <h3 style="margin-bottom: 10px;">Visitas por Usuario</h3>
            <div>
              ${Object.entries(this.visitasPorUsuario).map(([usuario, cantidad]) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <span style="font-weight: 500;">${usuario}</span>
                  <span style="font-weight: 600;">${cantidad}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      pdfContent.appendChild(statsSection);

      // Añadir el contenido al DOM temporalmente
      document.body.appendChild(pdfContent);

      // Generar el PDF
      html2canvas(pdfContent, {
        scale: 1,
        useCORS: true,
        logging: false
      }).then(canvas => {
        // Eliminar el contenido temporal después de capturarlo
        document.body.removeChild(pdfContent);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        const imgWidth = 280; // A4 landscape width in mm (297 - margins)
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const pageHeight = 190; // A4 landscape height in mm (210 - margins)

        let heightLeft = imgHeight;
        let position = 10; // Starting position (top margin)

        // Primera página
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Páginas adicionales si es necesario
        while (heightLeft > 0) {
          position = -pageHeight * (imgHeight - heightLeft) / imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Guardar PDF
        pdf.save(`reporte_zonas_${new Date().toISOString().split('T')[0]}.pdf`);

        // Restaurar la vista original
        this.viewMode = originalViewMode;
        this.itemsPerPage = originalItemsPerPage;
        this.isGeneratingPDF = false;
      });
    }, 500); // Esperar a que se actualice el DOM
  }

  /**
   * Método alternativo que exporta los registros actuales a PDF usando un enfoque más simple
   */
  exportSimplePDF() {
    // Crear documento PDF
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Configuraciones
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const maxWidth = pageWidth - (margin * 2);
    let y = 20; // posición y inicial

    // Añadir título y fecha
    pdf.setFontSize(18);
    pdf.setTextColor(67, 56, 202); // Indigo
    pdf.text('Reporte de Zonas Visitadas', pageWidth / 2, y, { align: 'center' });

    y += 10;
    pdf.setFontSize(10);
    pdf.setTextColor(107, 114, 128); // Gray
    pdf.text(`Fecha: ${new Date().toLocaleDateString()} | Total: ${this.totalVisitas} registros`, pageWidth / 2, y, { align: 'center' });

    y += 15;

    // Crear tabla
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Definir columnas de la tabla
    const columns = [
      'Nombre',
      'Tipo',
      'Usuario',
      'Acción',
      'Fecha'
    ];

    // Preparar datos
    const data = this.filteredZonas.map(item => [
      item.zona.nombre.length > 25 ? item.zona.nombre.substring(0, 22) + '...' : item.zona.nombre,
      item.zona.tipo,
      item.log.username,
      item.log.action,
      new Date(item.log.timestamp).toLocaleString()
    ]);

    // Dibujar tabla
    (pdf as any).autoTable({
      head: [columns],
      body: data,
      startY: y,
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [243, 244, 246],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      styles: {
        overflow: 'ellipsize',
        cellWidth: 'auto'
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Nombre
        1: { cellWidth: 30 }, // Tipo
        2: { cellWidth: 40 }, // Usuario
        3: { cellWidth: 40 }, // Acción
        4: { cellWidth: 40 }  // Fecha
      }
    });

    // Añadir página para estadísticas
    pdf.addPage();
    y = 20;

    // Título de estadísticas
    pdf.setFontSize(16);
    pdf.setTextColor(67, 56, 202); // Indigo
    pdf.text('Estadísticas', margin, y);

    y += 15;

    // Estadísticas por tipo
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Visitas por Tipo', margin, y);

    y += 10;

    // Tabla de tipos
    const tipoRows = Object.entries(this.visitasPorTipo).map(([tipo, cantidad]) => [
      tipo,
      cantidad.toString(),
      `${((cantidad / this.totalVisitas) * 100).toFixed(1)}%`
    ]);

    (pdf as any).autoTable({
      head: [['Tipo', 'Cantidad', 'Porcentaje']],
      body: tipoRows,
      startY: y,
      margin: { left: margin, right: pageWidth / 2 - 5 },
      headStyles: {
        fillColor: [67, 56, 202],
        textColor: [255, 255, 255]
      }
    });

    // Estadísticas por usuario (en la misma línea)
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Visitas por Usuario', pageWidth / 2 + 5, y - 10);

    // Tabla de usuarios
    const usuarioRows = Object.entries(this.visitasPorUsuario).map(([usuario, cantidad]) => [
      usuario,
      cantidad.toString(),
      `${((cantidad / this.totalVisitas) * 100).toFixed(1)}%`
    ]);

    (pdf as any).autoTable({
      head: [['Usuario', 'Cantidad', 'Porcentaje']],
      body: usuarioRows,
      startY: y,
      margin: { left: pageWidth / 2 + 5, right: margin },
      headStyles: {
        fillColor: [22, 163, 74],
        textColor: [255, 255, 255]
      }
    });

    // Guardar PDF
    pdf.save(`reporte_zonas_${new Date().toISOString().split('T')[0]}.pdf`);
  }
}
