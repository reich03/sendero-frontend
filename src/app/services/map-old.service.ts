// map.service.ts
import { Injectable } from '@angular/core';

export type PointType = 'fauna' | 'flora' | 'ecosistema';

export interface Comment {
  author: string;
  text: string;
  date: Date;
}

export interface Point {
  id: number;
  title: string;
  description: string;
  type: PointType;
  creator: string;
  imageUrl: string;
  additionalImages?: string[];
  dailyVisits: number;
  comments: Comment[];
  createdAt: Date;
  lat: number;
  lng: number;
  isFavorite: boolean;
  hasAR: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MapService {
  private points: Point[] = [
    {
      id: 1,
      title: 'Avistamiento de Mono Aullador',
      description: 'Zona de avistamiento frecuente del mono aullador rojo (Alouatta seniculus), especie nativa que habita en los bosques cercanos a la universidad.',
      type: 'fauna',
      creator: 'Dr. Juan Pérez',
      imageUrl: '../../assets/data-pruebva/image1.jpeg',
      additionalImages: ['assets/data/mono-aullador-2.jpg', 'assets/data/mono-aullador-3.jpg'],
      dailyVisits: 47,
      comments: [
        { author: 'Ana Gómez', text: 'Pude ver una familia completa esta mañana, increíble experiencia.', date: new Date('2025-04-10') },
        { author: 'Carlos Ruiz', text: 'Se escuchan sus aullidos desde el bloque de laboratorios.', date: new Date('2025-04-15') }
      ],
      createdAt: new Date('2025-01-15'),
      lat: 4.0853,
      lng: -73.582,
      isFavorite: false,
      hasAR: true
    },
    {
      id: 2,
      title: 'Orquídeas Cattleya',
      description: 'Colección de orquídeas del género Cattleya, consideradas las más vistosas y emblemáticas de Colombia. Este punto marca un área de conservación especial.',
      type: 'flora',
      creator: 'Bióloga Ana Gómez',
      imageUrl: '../../assets/data-pruebva/image1.jpeg',
      dailyVisits: 32,
      comments: [
        { author: 'Julio Verne', text: 'Las orquídeas están floreciendo ahora, es el mejor momento para visitarlas.', date: new Date('2025-04-18') }
      ],
      createdAt: new Date('2025-02-03'),
      lat: 4.087,
      lng: -73.584,
      isFavorite: true,
      hasAR: true
    },
    {
      id: 3,
      title: 'Humedal Las Garzas',
      description: 'Ecosistema acuático dentro del campus universitario. Alberga diversas especies de aves y plantas acuáticas. Punto crucial para la conservación de la biodiversidad local.',
      type: 'ecosistema',
      creator: 'Equipo de Ciencias Ambientales',
      imageUrl: '../../assets/data-pruebva/image2.jpeg',
      additionalImages: ['assets/data/humedal-2.jpg'],
      dailyVisits: 65,
      comments: [
        { author: 'Pedro Ramírez', text: 'Un lugar perfecto para la observación de aves migratorias durante esta temporada.', date: new Date('2025-04-05') },
        { author: 'Laura Suárez', text: 'Estamos desarrollando un proyecto de monitoreo de calidad del agua aquí.', date: new Date('2025-04-12') }
      ],
      createdAt: new Date('2025-01-22'),
      lat: 4.0845,
      lng: -73.5855,
      isFavorite: false,
      hasAR: false
    },
    {
      id: 4,
      title: 'Colonia de Guacamayas',
      description: 'Lugar de anidación de guacamayas azul y amarillo (Ara ararauna). Estas aves coloridas son residentes permanentes del campus.',
      type: 'fauna',
      creator: 'Dr. Miguel Torres',
      imageUrl: '../../assets/data-pruebva/image1.jpeg',
      dailyVisits: 53,
      comments: [
        { author: 'Sofía García', text: 'Se pueden observar especialmente al amanecer y atardecer cuando son más activas.', date: new Date('2025-04-17') }
      ],
      createdAt: new Date('2025-03-10'),
      lat: 4.0865,
      lng: -73.5835,
      isFavorite: false,
      hasAR: true
    },
    {
      id: 5,
      title: 'Sendero de Helechos Gigantes',
      description: 'Colección de helechos arborescentes nativos de la región amazónica. Algunos ejemplares tienen más de 15 años de edad.',
      type: 'flora',
      creator: 'Dra. Claudia Moreno',
      imageUrl: '../../assets/data-pruebva/image1.jpeg',
      dailyVisits: 28,
      comments: [],
      createdAt: new Date('2025-02-28'),
      lat: 4.0840,
      lng: -73.5810,
      isFavorite: false,
      hasAR: false
    },
    {
      id: 6,
      title: 'Bosque de Galería',
      description: 'Ecosistema boscoso que bordea los caños y arroyos del campus. Importante corredor biológico para la fauna local.',
      type: 'ecosistema',
      creator: 'Grupo de Investigación Ecológica',
      imageUrl: '../../assets/data-pruebva/image2.jpeg',
      dailyVisits: 41,
      comments: [
        { author: 'Roberto Díaz', text: 'Realizamos inventarios de biodiversidad mensuales en esta zona.', date: new Date('2025-03-25') }
      ],
      createdAt: new Date('2025-01-30'),
      lat: 4.0875,
      lng: -73.5825,
      isFavorite: true,
      hasAR: true
    }
  ];

  constructor() { }

  getPoints(): Point[] {
    return this.points;
  }

  getPointById(id: number): Point | undefined {
    return this.points.find(point => point.id === id);
  }

  toggleFavorite(id: number): void {
    const point = this.points.find(p => p.id === id);
    if (point) {
      point.isFavorite = !point.isFavorite;
    }
  }

  addComment(pointId: number, comment: Comment): void {
    const point = this.points.find(p => p.id === pointId);
    if (point) {
      point.comments.push(comment);
    }
  }
}
