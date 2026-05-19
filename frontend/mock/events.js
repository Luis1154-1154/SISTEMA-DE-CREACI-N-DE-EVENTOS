window.MOCK_EVENTS = [
  {
    id: 1,
    nombre: 'Global Tech Summit 2026',
    fecha: '2026-10-15',
    fechaTexto: 'Oct 15 - Oct 17, 2026',
    lugar: 'Moscone Center, San Francisco',
    seccion: 'educativos',
    descripcion: 'Conferencias y mesas redondas sobre tecnología y transformación digital.',
    organizador: 'TechCorp',
    estatus: 'activo',
    inscritos: ['Juan Díaz', 'Ana Kim', 'Luis Pérez']
  },
  {
    id: 2,
    nombre: 'Executive Leadership Workshop',
    fecha: '2026-11-05',
    fechaTexto: 'Nov 05, 2026',
    lugar: 'Virtual (Zoom)',
    seccion: 'culturales',
    descripcion: 'Taller para ejecutivos enfocado en liderazgo y gestión de equipos.',
    organizador: 'LeadWell',
    estatus: 'cancelado',
    inscritos: ['María Ruiz', 'Carlos Gómez']
  },
  {
    id: 3,
    nombre: 'Q4 Product Launch Gala',
    fecha: '2026-05-18',
    fechaTexto: 'Hoy!',
    lugar: 'Grand Plaza Hotel, NY',
    seccion: 'sociales',
    descripcion: 'Gala de lanzamiento de producto con invitados especiales.',
    organizador: 'BrandWorks',
    estatus: 'finalizado',
    inscritos: ['Equipo interno', 'Partners']
  }
  ,
  {
    id: 4,
    nombre: 'City Marathon 2026',
    fecha: '2026-09-12',
    fechaTexto: 'Sep 12, 2026',
    lugar: 'Paseo de la Ciudad',
    seccion: 'deportivos',
    descripcion: 'Carrera anual de 10K por las principales avenidas de la ciudad.',
    organizador: 'RunClub',
    estatus: 'activo',
    inscritos: ['Corredor1', 'Corredor2']
  }
];

// Utility to get mock by id
window.getMockEventById = function (id) {
  return window.MOCK_EVENTS.find(e => e.id === id);
};
