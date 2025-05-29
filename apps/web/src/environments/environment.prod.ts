export const environment = {
  production: true,
  apiUrl: typeof process !== 'undefined' && process.env && process.env['API_URL'] ? process.env['API_URL'] : 'http://localhost:8080/api'
};
