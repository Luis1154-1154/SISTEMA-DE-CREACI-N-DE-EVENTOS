// Lista de administradores predefinidos del sistema
window.ADMINISTRATORS = [
  {
    email: 'admin@eventmaster.com',
    nombre: 'Admin Principal'
  },
  {
    email: 'joelsoltero161@gmail.com',
    nombre: 'Joel Soltero'
  },
  {
    email: 'essaeltorres@gmail.com',
    nombre: 'Essael Torres'
  },
  {
    email: 'director@ucol.mx',
    nombre: 'Director de Eventos'
  }
];

// Función para verificar si un usuario es administrador
window.isUserAdmin = function(email) {
  return window.ADMINISTRATORS.some(admin => 
    admin.email.toLowerCase() === email.toLowerCase()
  );
};

// Función para obtener administrador por email
window.getAdminByEmail = function(email) {
  return window.ADMINISTRATORS.find(admin => 
    admin.email.toLowerCase() === email.toLowerCase()
  );
};
