FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG CACHEBUST=1
RUN npm run build
RUN cp /app/dist/public/login.html /app/dist/login.html && \
    cp /app/dist/public/newPost.html /app/dist/newPost.html && \
    cp /app/dist/public/profile.html /app/dist/profile.html && \
    cp /app/dist/public/socialfeed.html /app/dist/socialfeed.html && \
    cp -r /app/public/static/images /app/dist/images && \
    cp -r /app/public/bootstrap /app/dist/bootstrap && \
    rm -rf /app/dist/public

FROM pierrezemb/gostatic
COPY --from=builder /app/dist /srv/http/
CMD ["-port", "8080", "-https-promote", "-enable-logging"]