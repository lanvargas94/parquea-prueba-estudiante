// Reglas del negocio del parqueadero. Funciones puras: no tocan base de datos ni red,
// por eso se prueban fácil (ver test/reglas.test.js).

const TARIFA_POR_HORA = { carro: 3000, moto: 1500 };   // pesos colombianos
const CUPOS = { carro: 20, moto: 10 };

// Placas de Colombia: carro "ABC123", moto "ABC12D"
const FORMATO_PLACA = { carro: /^[A-Z]{3}\d{3}$/, moto: /^[A-Z]{3}\d{2}[A-Z]$/ };

function normalizarPlaca(placa) {
  return String(placa ?? '').toUpperCase().replace(/[\s-]/g, '');
}

function validarEntrada({ placa, tipo }) {
  if (!TARIFA_POR_HORA[tipo]) return 'El tipo debe ser "carro" o "moto"';
  const p = normalizarPlaca(placa);
  if (!FORMATO_PLACA[tipo].test(p)) {
    return tipo === 'carro' ? 'Placa de carro inválida (ej. ABC123)' : 'Placa de moto inválida (ej. ABC12D)';
  }
  return null; // sin error
}

// Se cobra por hora o fracción, mínimo una hora.
function calcularCobro(tipo, minutos) {
  const horas = Math.max(1, Math.ceil(minutos / 60));
  return { horas, valor: horas * TARIFA_POR_HORA[tipo] };
}

module.exports = { TARIFA_POR_HORA, CUPOS, normalizarPlaca, validarEntrada, calcularCobro };
