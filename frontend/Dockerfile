# Stage 1: Build Vue 3 App
FROM node:24-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
# xlsx diambil langsung dari CDN SheetJS (bukan registry npm), yang pernah timeout
# saat build (ETIMEDOUT). npm default nyaris tidak retry request lambat; naikkan
# timeout & retry supaya satu hiccup jaringan ke CDN pihak ketiga tidak langsung
# menggagalkan seluruh build.
RUN npm config set fetch-timeout 300000 \
 && npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000 \
 && npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
