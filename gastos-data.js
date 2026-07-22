// Registro de gastos de la casa.
// Cada vez que Rosario comparta un nuevo recibo, se agrega una entrada aquí.
// No se guardan números de cuenta, claves de rastreo ni números de
// autorización — solo lo necesario para que la familia entienda en qué
// se gastó el dinero.
//
// category debe ser una de: 'Materiales', 'Mano de obra', 'Puertas y ventanas', 'Otros'

const GASTOS = [
  {
    date: '2026-07-13',
    concept: 'Gas, comida y gastos extra',
    category: 'Otros',
    paidTo: 'José P.',
    amount: 1500,
  },
  {
    date: '2026-07-13',
    concept: 'Resto de materiales — cemento',
    category: 'Materiales',
    paidTo: 'José P.',
    amount: 305,
  },
  {
    date: '2026-07-13',
    concept: 'Pago de plomero',
    category: 'Mano de obra',
    paidTo: 'José P.',
    amount: 3000,
  },
  {
    date: '2026-07-14',
    concept: 'Pago de plomero',
    category: 'Mano de obra',
    paidTo: 'José P.',
    amount: 2600,
  },
  {
    date: '2026-07-14',
    concept: 'Depósito de puerta principal (Folio 0536)',
    category: 'Puertas y ventanas',
    paidTo: 'Marcos C.',
    amount: 8500,
  },
  {
    date: '2026-07-11',
    concept: 'Azulejo, piso, pegazulejo y junteador (2 baños)',
    category: 'Materiales',
    paidTo: 'Pisos y Azulejos Treba',
    amount: 13213,
  },
  {
    date: '2026-07-11',
    concept: '2 juegos de baño (WC + lavabo) — paquete Oxford',
    category: 'Materiales',
    paidTo: 'Pisos y Azulejos Treba',
    amount: 7980,
  },
  {
    date: '2026-07-13',
    concept: 'Mitad de 4 ventanas (Pedro Escobedo)',
    category: 'Puertas y ventanas',
    paidTo: 'Patricia G. (ventanas)',
    amount: 14000,
  },
  {
    date: '2026-07-14',
    concept: 'Renta de casa',
    category: 'Otros',
    paidTo: 'José Palacios',
    amount: 5000,
  },
  {
    date: '2026-07-15',
    concept: 'Pago a Tío Victor',
    category: 'Otros',
    paidTo: 'Tío Victor',
    amount: 10000,
  },
  {
    date: '2026-07-16',
    concept: 'Gastos de mudanza',
    category: 'Otros',
    paidTo: 'José Palacios',
    amount: 4000,
  },
  {
    date: '2026-07-17',
    concept: 'Pago final de 4 ventanas — ventanas terminadas',
    category: 'Puertas y ventanas',
    paidTo: 'Patricia G. (ventanas)',
    amount: 14000,
  },
  {
    date: '2026-07-21',
    concept: 'Pago al herrero por la puerta',
    category: 'Puertas y ventanas',
    paidTo: 'Herrero',
    amount: 8500,
  },
  {
    date: '2026-07-22',
    concept: 'Reembolso de Tío Victor — ya no hará los pisos',
    category: 'Otros',
    paidTo: 'Tío Victor',
    amount: -6000,
  },
];
