// Punto de arranque. La configuración llega por variables de entorno (12-factor).
const { abrir } = require('./db');
const { crearApp } = require('./app');

const PUERTO = Number(process.env.PORT || 3000);
const RUTA_DB = process.env.DB_PATH || 'parqueadero.db';
const VERSION = process.env.APP_VERSION || 'local';

crearApp({ db: abrir(RUTA_DB), version: VERSION }).listen(PUERTO, () => {
  console.log(`ParqueaHuila ${VERSION} escuchando en el puerto ${PUERTO}`);
});
