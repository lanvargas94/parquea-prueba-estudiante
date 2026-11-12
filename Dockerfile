# Imagen de ParqueaHuila: Node 22 en Alpine (liviana: ~60 MB), sin dependencias externas.
FROM node:22-alpine

# Parches de seguridad del sistema base (así Trivy no encuentra críticas ya corregidas)
RUN apk upgrade --no-cache

WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public

# La base de datos vive en /data, que en producción es un volumen
RUN mkdir /data && chown node:node /data
ENV NODE_ENV=production PORT=3000 DB_PATH=/data/parqueadero.db

# nunca correr como root
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/status || exit 1
CMD ["node", "src/server.js"]
