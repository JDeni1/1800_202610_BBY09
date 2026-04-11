FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG CACHEBUST=2
RUN npm run build
RUN cp -r /app/public/static/images /app/dist/images && \
    cp -r /app/public/bootstrap /app/dist/bootstrap

FROM pierrezemb/gostatic
COPY --from=builder /app/dist /srv/http/
CMD ["-port", "8080", "-https-promote", "-enable-logging"]