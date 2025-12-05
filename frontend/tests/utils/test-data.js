/**
 * Données de test
 */

export const testUsers = {
  valid: {
    first_name: 'Test',
    last_name: 'User',
    email: 'm.bilucas@hotmail.fr',
    phone: '0612345678',
    password: 'laye123',
    date_of_birth: '1990-01-15',
  },

  new: () => ({
    first_name: 'New',
    last_name: 'TestUser',
    email: `test-${Date.now()}@test.com`,
    phone: '0623456789',
    password: 'TestPass123',
    date_of_birth: '1995-06-20',
  }),
};

export const testAddresses = {
  marrakech: {
    address: '12 Rue Test, Marrakech',
    city: 'Marrakech',
    latitude: 31.6295,
    longitude: -7.9811,
  },
  casablanca: {
    address: '25 Boulevard Mohamed V, Casablanca',
    city: 'Casablanca',
    latitude: 33.5731,
    longitude: -7.5898,
  },
};

export const testServices = {
  menage: {
    id: 1,
    name: 'Ménage',
    basePrice: 175,
  },
};
