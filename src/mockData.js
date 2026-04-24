// Datos Simulados para TecCarpool (Matamoros)

export const currentUser = {
  id: 'u1',
  name: 'Oscar Ruiz',
  email: 'L20230000@matamoros.tecnm.mx',
  controlNumber: '20230000',
  career: 'Ingeniería en Mecatrónica',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
  role: 'passenger', // 'driver' or 'passenger'
  rating: 4.8
};

export const currentDriver = {
  id: 'u2',
  name: 'Oscar Salazar',
  email: 'L22260053@matamoros.tecnm.mx',
  controlNumber: '22260053',
  career: 'Ingeniería en Sistemas Computacionales',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oscar',
  role: 'driver',
  rating: 4.9,
  car: {
    model: 'Chevrolet Aveo',
    color: 'Plata',
    plate: 'XHT-123-A',
    capacity: 4
  }
};

export const popularLocations = [
  { id: 'l1', name: 'TecNM Campus Matamoros', lat: 25.8451, lng: -97.5251 },
  { id: 'l2', name: 'Plaza Fiesta', lat: 25.8643, lng: -97.5028 },
  { id: 'l3', name: 'Parque Olímpico', lat: 25.8821, lng: -97.5015 },
  { id: 'l4', name: 'Soriana Laguneta', lat: 25.8655, lng: -97.5342 },
  { id: 'l5', name: 'Puente Internacional Nuevo', lat: 25.9012, lng: -97.5034 }
];

export const mockRoutes = [
  {
    id: 'r1',
    driverId: 'u2',
    driverName: 'Ana Martínez',
    driverAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana',
    carModel: 'Chevrolet Aveo',
    plate: 'XHT-123-A',
    from: { name: 'Plaza Fiesta', lat: 25.8643, lng: -97.5028 },
    to: { name: 'TecNM Campus Matamoros', lat: 25.8451, lng: -97.5251 },
    time: '07:30 AM',
    date: '2026-04-24',
    availableSeats: 3,
    totalSeats: 4,
    price: 35,
    status: 'active'
  },
  {
    id: 'r2',
    driverId: 'u3',
    driverName: 'Carlos Gómez',
    driverAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos',
    carModel: 'Nissan Versa',
    plate: 'XYZ-987-B',
    from: { name: 'TecNM Campus Matamoros', lat: 25.8451, lng: -97.5251 },
    to: { name: 'Parque Olímpico', lat: 25.8821, lng: -97.5015 },
    time: '14:15 PM',
    date: '2026-04-24',
    availableSeats: 1,
    totalSeats: 3,
    price: 40,
    status: 'active'
  },
  {
    id: 'r3',
    driverId: 'u4',
    driverName: 'Luis Sánchez',
    driverAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luis',
    carModel: 'Kia Rio',
    plate: 'JKL-456-C',
    from: { name: 'Soriana Laguneta', lat: 25.8655, lng: -97.5342 },
    to: { name: 'TecNM Campus Matamoros', lat: 25.8451, lng: -97.5251 },
    time: '08:00 AM',
    date: '2026-04-24',
    availableSeats: 0,
    totalSeats: 4,
    price: 30,
    status: 'full'
  }
];

export const mockRequests = [
  {
    id: 'req1',
    routeId: 'r1',
    passenger: {
      id: 'p1',
      name: 'Ximena Amador',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mario',
      rating: 4.8,
      isVerified: true
    },
    status: 'pending', // pending, accepted, rejected
    message: 'Hola, ¿tienes espacio? Llevo mochila pequeña.'
  },
  {
    id: 'req2',
    routeId: 'r1',
    passenger: {
      id: 'p2',
      name: 'Diego Salazarx',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Laura',
      rating: 5.0,
      isVerified: true
    },
    status: 'pending',
    message: '¡Apenas para llegar a mi clase de las 8! ¿Me llevas?'
  }
];

export const mockPassengerNotifications = [
  { id: 'n1', text: '✅ Oscar Salazae ha aceptado tu solicitud de viaje hacia el Tec.', time: 'Hace 5 min', isRead: false },
  { id: 'n2', text: '⚠️ Tu viaje a Plaza Fiesta ha sido cambiado a las 14:30 PM.', time: 'Hace 1 hora', isRead: true },
  { id: 'n3', text: '🔔 Recuerda tener tu identificación universitaria a la mano.', time: 'Hace 1 día', isRead: true }
];

export const mockDriverNotifications = [
  { id: 'n4', text: '👤 Tienes 2 nuevas peticiones en tu buzón para tu ruta a las 07:30 AM.', time: 'Hace 10 min', isRead: false },
  { id: 'n5', text: '🌟 Ximena Amador te ha dejado una calificación de 5 estrellas.', time: 'Hace 2 horas', isRead: true },
  { id: 'n6', text: '🎉 ¡Felicidades! Has completado suficientes viajes para ser Conductor Verificado.', time: 'Hace 1 día', isRead: true }
];
