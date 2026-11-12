# ParqueaHuila

Parqueadero de ejemplo para la clase de **CI/CD con GitHub Actions y AWS** (Arquitectura de Software · CORHUILA).

- Registrar entrada (placa + carro/moto), ver cupos libres, registrar salida y cobrar.
- Tarifas: carro $3.000/h, moto $1.500/h, por hora o fracción (mínimo 1 h). Cupos: 20 carros, 10 motos.
- Node 22 sin dependencias externas + SQLite integrado (`node:sqlite`).

```bash
npm test     # 9 pruebas
npm start    # http://localhost:3000
```

Pipeline (`.github/workflows/ci-cd.yml`): **1 Pruebas → 2 Imagen + Trivy → GHCR → 3 Desplegar en EC2 → 4 Verificar**.
