// La API HTTP. Recibe la base de datos y un "reloj" desde afuera para poder probarla.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { CUPOS, TARIFA_POR_HORA, normalizarPlaca, validarEntrada, calcularCobro } = require('./reglas');

const INDEX = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'));

function crearApp({ db, ahora = () => new Date(), version = 'local' }) {
  function json(res, codigo, cuerpo) {
    res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(cuerpo));
  }

  async function leerCuerpo(req) {
    let datos = '';
    for await (const trozo of req) {
      datos += trozo;
      if (datos.length > 10_000) throw new Error('cuerpo muy grande');
    }
    return datos ? JSON.parse(datos) : {};
  }

  const rutas = {
    'GET /': (req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(INDEX);
    },

    'GET /api/status': (req, res) => json(res, 200, { status: 'online', app: 'ParqueaHuila', version }),

    'GET /api/parqueadero': (req, res) => {
      const libres = {};
      for (const tipo of Object.keys(CUPOS)) libres[tipo] = CUPOS[tipo] - db.contarAdentro(tipo);
      const hoy = ahora().toISOString().slice(0, 10);
      json(res, 200, { adentro: db.adentro(), libres, tarifas: TARIFA_POR_HORA, recaudoHoy: db.recaudoDelDia(hoy) });
    },

    'POST /api/entradas': async (req, res) => {
      const { placa, tipo } = await leerCuerpo(req);
      const error = validarEntrada({ placa, tipo });
      if (error) return json(res, 400, { error });
      const p = normalizarPlaca(placa);
      if (db.buscarAdentro(p)) return json(res, 409, { error: `La placa ${p} ya está adentro` });
      if (db.contarAdentro(tipo) >= CUPOS[tipo]) return json(res, 409, { error: `No hay cupos para ${tipo}` });
      const entrada = ahora().toISOString();
      db.registrarEntrada(p, tipo, entrada);
      json(res, 201, { placa: p, tipo, entrada });
    },

    'POST /api/salidas': async (req, res) => {
      const p = normalizarPlaca((await leerCuerpo(req)).placa);
      const estancia = db.buscarAdentro(p);
      if (!estancia) return json(res, 404, { error: `La placa ${p} no está en el parqueadero` });
      const salida = ahora();
      const minutos = Math.round((salida - new Date(estancia.entrada)) / 60000);
      const { horas, valor } = calcularCobro(estancia.tipo, minutos);
      db.registrarSalida(estancia.id, salida.toISOString(), valor);
      json(res, 200, { placa: p, tipo: estancia.tipo, minutos, horas, valor });
    },
  };

  return http.createServer(async (req, res) => {
    const ruta = rutas[`${req.method} ${req.url.split('?')[0]}`];
    if (!ruta) return json(res, 404, { error: 'Ruta no encontrada' });
    try {
      await ruta(req, res);
    } catch (e) {
      console.error(e);                       // el detalle queda en el log, nunca se le muestra al cliente
      json(res, 400, { error: 'Solicitud inválida' });
    }
  });
}

module.exports = { crearApp };
