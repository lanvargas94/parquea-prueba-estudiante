// Pruebas de la API completa: levanta el servidor con una base en memoria y un reloj falso.
const test = require('node:test');
const assert = require('node:assert/strict');
const { abrir } = require('../src/db');
const { crearApp } = require('../src/app');

async function arrancar() {
  let reloj = new Date('2026-11-11T08:00:00Z');
  const servidor = crearApp({ db: abrir(':memory:'), ahora: () => reloj, version: 'prueba' });
  await new Promise((ok) => servidor.listen(0, ok));
  const base = `http://127.0.0.1:${servidor.address().port}`;
  const pedir = async (metodo, ruta, cuerpo) => {
    const r = await fetch(base + ruta, { method: metodo, body: cuerpo && JSON.stringify(cuerpo) });
    return { codigo: r.status, datos: await r.json() };
  };
  return { pedir, avanzar: (min) => { reloj = new Date(reloj.getTime() + min * 60000); }, cerrar: () => servidor.close() };
}

test('entrada, salida y cobro de una moto que estuvo 90 minutos', async (t) => {
  const app = await arrancar();
  t.after(app.cerrar);
  assert.equal((await app.pedir('POST', '/api/entradas', { placa: 'xyz12a', tipo: 'moto' })).codigo, 201);
  app.avanzar(90);
  const salida = await app.pedir('POST', '/api/salidas', { placa: 'XYZ12A' });
  assert.equal(salida.codigo, 200);
  assert.deepEqual(salida.datos, { placa: 'XYZ12A', tipo: 'moto', minutos: 90, horas: 2, valor: 3000 });
  assert.equal((await app.pedir('GET', '/api/parqueadero')).datos.recaudoHoy, 3000);
});

test('no deja entrar dos veces la misma placa', async (t) => {
  const app = await arrancar();
  t.after(app.cerrar);
  await app.pedir('POST', '/api/entradas', { placa: 'ABC123', tipo: 'carro' });
  const otra = await app.pedir('POST', '/api/entradas', { placa: 'abc 123', tipo: 'carro' });
  assert.equal(otra.codigo, 409);
});

test('cuando se llenan los 10 cupos de motos, la 11 no entra', async (t) => {
  const app = await arrancar();
  t.after(app.cerrar);
  for (let i = 0; i < 10; i++) {
    assert.equal((await app.pedir('POST', '/api/entradas', { placa: `MOT1${i}A`, tipo: 'moto' })).codigo, 201);
  }
  assert.equal((await app.pedir('POST', '/api/entradas', { placa: 'MOT99Z', tipo: 'moto' })).codigo, 409);
  assert.equal((await app.pedir('GET', '/api/parqueadero')).datos.libres.moto, 0);
});

test('/api/status dice qué versión está corriendo', async (t) => {
  const app = await arrancar();
  t.after(app.cerrar);
  assert.deepEqual((await app.pedir('GET', '/api/status')).datos, { status: 'online', app: 'ParqueaHuila', version: 'prueba' });
});
