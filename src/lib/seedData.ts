import { User, WorkEvent } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1',
    name: 'Verónica',
    lastName: 'Mattalia',
    email: 'veronica.mattalia@apexamerica.com',
    legajo: '12142',
    role: 'ADMIN',
    department: 'Gestión de Operaciones',
    active: true,
  },
];

/**
 * Retorna la lista inicial de eventos.
 * Por solicitud del usuario: la app inicia limpia, sin registros previos.
 */
export function getInitialEvents(): WorkEvent[] {
  return [];
}
