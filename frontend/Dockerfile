# Stage 1: Build Vue 3 App
FROM node:24-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
# xlsx comes from a tarball kept in the repo (vendor/), not from the SheetJS CDN, so the
# build does not depend on a third-party host that has timed out on the server before.
COPY vendor ./vendor
RUN npm config set fetch-timeout 120000 \
 && npm config set fetch-retries 3 \
 && npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
