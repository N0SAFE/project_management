declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

export const environment = {
  production: false,
  apiUrl: typeof process !== 'undefined' && process.env && process.env['API_URL'] ? process.env['API_URL'] : 'http://localhost:8080/api'
};
