export interface Estacion {
  id: number;
  nombre: string;
  descripcion: string;
  imagenPortada?: string;
  zonas: Point[];
  createdAt: string;
  updatedAt: string;
  fechaCreacion: string;
}

export type PointType = 'fauna' | 'flora' | 'ecosistema';

export interface Point {
  id: number;
  title: string;
  type: PointType;
  description: string;
  lat: number;
  lng: number;
  imageUrl: string;
  additionalImages?: string[];
  isFavorite: boolean;
  creator: string;
  createdAt: string;
  dailyVisits?: number;
  hasAR?: boolean;
  comments?: any[];
}


export interface EstudioRequest {
  nombre: string;
  descripcion: string;
  imagenPortada?: string;
}

export interface CreateEstacionRequest {
  nombre: string;
  descripcion: string;
}
