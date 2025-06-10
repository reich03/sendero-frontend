export interface Evento {
  id: number;
  nombre: string;
  descripcion: string;
  fechaEvento: string;
  usuarioCreador: User;
  estacion: Estacion;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface EventoRequest {
  nombre: string;
  descripcion: string;
  fechaEvento: string;
  estacionId: number;
  usuarioId: number;
}

import { Estacion } from './estacion.model';
