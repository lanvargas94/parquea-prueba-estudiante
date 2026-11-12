// Pruebas de las reglas del negocio. Se corren con:  npm test
const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularCobro, validarEntrada, normalizarPlaca } = require('../src/reglas');

test('un carro 30 minutos paga la hora mínima: $3.500', () => {
  assert.deepEqual(calcularCobro('carro', 30), { horas: 1, valor: 3500 });
});

test('una moto 61 minutos paga 2 horas: $3.000', () => {
  assert.deepEqual(calcularCobro('moto', 61), { horas: 2, valor: 3000 });
});

test('un carro 3 horas exactas paga 3 horas: $10.500', () => {
  assert.deepEqual(calcularCobro('carro', 180), { horas: 3, valor: 10500 });
});

test('la placa se normaliza: " abc-123 " queda "ABC123"', () => {
  assert.equal(normalizarPlaca(' abc-123 '), 'ABC123');
});

test('rechaza placas con formato inválido', () => {
  assert.equal(validarEntrada({ placa: 'ABC123', tipo: 'carro' }), null);
  assert.equal(validarEntrada({ placa: 'ABC12D', tipo: 'moto' }), null);
  assert.match(validarEntrada({ placa: '12ABC', tipo: 'carro' }), /inválida/);
  assert.match(validarEntrada({ placa: 'ABC123', tipo: 'bus' }), /tipo/);
});
