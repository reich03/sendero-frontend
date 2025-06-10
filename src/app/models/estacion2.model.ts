
export interface Estacion {
  id: number;
  nombre: string;
  descripcion: string;
  imagenPortada?: string;
  zonas: Zona[];
  fechaCreacion: string;
  usuarioCreador: {
    id: number;
    username: string;
    password: string;
    email: string;
    role: string;
  };
}

export interface Zona {
  id: number;
  nombre: string;
  tipo: 'FLORA' | 'FAUNA' | 'ECOSISTEMA';
  descripcion: string;
  latitud: number;
  longitud: number;
  imagenes: string[];
  creadoPor: string;
  fechaCreacion: string;
  comentarios: any[];
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
