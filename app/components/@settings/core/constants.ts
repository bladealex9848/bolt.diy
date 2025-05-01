import type { TabType } from './types';

export const TAB_ICONS: Record<TabType, string> = {
  profile: 'i-ph:user-circle-fill',
  settings: 'i-ph:gear-six-fill',
  notifications: 'i-ph:bell-fill',
  features: 'i-ph:star-fill',
  data: 'i-ph:database-fill',
  'cloud-providers': 'i-ph:cloud-fill',
  'local-providers': 'i-ph:desktop-fill',
  'service-status': 'i-ph:activity-bold',
  connection: 'i-ph:wifi-high-fill',
  debug: 'i-ph:bug-fill',
  'event-logs': 'i-ph:list-bullets-fill',
  update: 'i-ph:arrow-clockwise-fill',
  'task-manager': 'i-ph:chart-line-fill',
  'tab-management': 'i-ph:squares-four-fill',
};

export const TAB_LABELS: Record<TabType, string> = {
  profile: 'Perfil',
  settings: 'Configuración',
  notifications: 'Notificaciones',
  features: 'Características',
  data: 'Gestión de Datos',
  'cloud-providers': 'Proveedores en la Nube',
  'local-providers': 'Proveedores Locales',
  'service-status': 'Estado del Servicio',
  connection: 'Conexión',
  debug: 'Depuración',
  'event-logs': 'Registros de Eventos',
  update: 'Actualizaciones',
  'task-manager': 'Administrador de Tareas',
  'tab-management': 'Gestión de Pestañas',
};

export const TAB_DESCRIPTIONS: Record<TabType, string> = {
  profile: 'Gestiona tu perfil y configuración de cuenta',
  settings: 'Configura las preferencias de la aplicación',
  notifications: 'Visualiza y gestiona tus notificaciones',
  features: 'Explora características nuevas y próximas',
  data: 'Gestiona tus datos y almacenamiento',
  'cloud-providers': 'Configura proveedores y modelos de IA en la nube',
  'local-providers': 'Configura proveedores y modelos de IA locales',
  'service-status': 'Monitorea el estado del servicio LLM en la nube',
  connection: 'Verifica el estado y configuración de la conexión',
  debug: 'Herramientas de depuración e información del sistema',
  'event-logs': 'Visualiza eventos y registros del sistema',
  update: 'Verifica actualizaciones y notas de versión',
  'task-manager': 'Monitorea recursos y procesos del sistema',
  'tab-management': 'Configura las pestañas visibles y su orden',
};

export const DEFAULT_TAB_CONFIG = [
  // User Window Tabs (Always visible by default)
  { id: 'features', visible: true, window: 'user' as const, order: 0 },
  { id: 'data', visible: true, window: 'user' as const, order: 1 },
  { id: 'cloud-providers', visible: true, window: 'user' as const, order: 2 },
  { id: 'local-providers', visible: true, window: 'user' as const, order: 3 },
  { id: 'connection', visible: true, window: 'user' as const, order: 4 },
  { id: 'notifications', visible: true, window: 'user' as const, order: 5 },
  { id: 'event-logs', visible: true, window: 'user' as const, order: 6 },

  // User Window Tabs (In dropdown, initially hidden)
  { id: 'profile', visible: false, window: 'user' as const, order: 7 },
  { id: 'settings', visible: false, window: 'user' as const, order: 8 },
  { id: 'task-manager', visible: false, window: 'user' as const, order: 9 },
  { id: 'service-status', visible: false, window: 'user' as const, order: 10 },

  // User Window Tabs (Hidden, controlled by TaskManagerTab)
  { id: 'debug', visible: false, window: 'user' as const, order: 11 },
  { id: 'update', visible: false, window: 'user' as const, order: 12 },

  // Developer Window Tabs (All visible by default)
  { id: 'features', visible: true, window: 'developer' as const, order: 0 },
  { id: 'data', visible: true, window: 'developer' as const, order: 1 },
  { id: 'cloud-providers', visible: true, window: 'developer' as const, order: 2 },
  { id: 'local-providers', visible: true, window: 'developer' as const, order: 3 },
  { id: 'connection', visible: true, window: 'developer' as const, order: 4 },
  { id: 'notifications', visible: true, window: 'developer' as const, order: 5 },
  { id: 'event-logs', visible: true, window: 'developer' as const, order: 6 },
  { id: 'profile', visible: true, window: 'developer' as const, order: 7 },
  { id: 'settings', visible: true, window: 'developer' as const, order: 8 },
  { id: 'task-manager', visible: true, window: 'developer' as const, order: 9 },
  { id: 'service-status', visible: true, window: 'developer' as const, order: 10 },
  { id: 'debug', visible: true, window: 'developer' as const, order: 11 },
  { id: 'update', visible: true, window: 'developer' as const, order: 12 },
];
