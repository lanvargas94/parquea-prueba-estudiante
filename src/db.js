// Acceso a datos: SQLite que ya trae Node 22 (sin instalar nada).
// En producción el archivo vive en un volumen de Docker, así los datos sobreviven a cada despliegue.
const { DatabaseSync } = require('node:sqlite');

function abrir(ruta = ':memory:') {
  const db = new DatabaseSync(ruta);
  db.exec(`
    CREATE TABLE IF NOT EXISTS estancias (
      id      INTEGER PRIMARY KEY AUTOINCREMENT,
      placa   TEXT NOT NULL,
      tipo    TEXT NOT NULL CHECK (tipo IN ('carro','moto')),
      entrada TEXT NOT NULL,
      salida  TEXT,
      valor   INTEGER
    )`);

  return {
    adentro: () => db.prepare('SELECT placa, tipo, entrada FROM estancias WHERE salida IS NULL ORDER BY entrada').all(),
    buscarAdentro: (placa) => db.prepare('SELECT * FROM estancias WHERE placa = ? AND salida IS NULL').get(placa),
    contarAdentro: (tipo) => db.prepare('SELECT COUNT(*) AS n FROM estancias WHERE tipo = ? AND salida IS NULL').get(tipo).n,
    registrarEntrada: (placa, tipo, entrada) =>
      db.prepare('INSERT INTO estancias (placa, tipo, entrada) VALUES (?, ?, ?)').run(placa, tipo, entrada),
    registrarSalida: (id, salida, valor) =>
      db.prepare('UPDATE estancias SET salida = ?, valor = ? WHERE id = ?').run(salida, valor, id),
    recaudoDelDia: (dia) =>
      db.prepare("SELECT COALESCE(SUM(valor),0) AS total FROM estancias WHERE substr(salida,1,10) = ?").get(dia).total,
  };
}

module.exports = { abrir };
