export interface Administrador {
  id: number;
  nombre: string;
  contrasena: string;
  permisoAdmin: boolean;
}

export interface Cajero {
  id: number;
  nombre: string;
  estadolinea: boolean;
  numerotelefono: string;
  idgrupo: string;
  conteo: number;
  maxconteo: number;
  conteoDia: number;
}

export interface Macro {
  id: number;
  'cbu100%': string;
  'cbu90%': string;
}

export enum NotificationType {
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  INFO = 'INFO'
}

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}