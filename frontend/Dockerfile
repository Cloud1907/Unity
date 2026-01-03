# Frontend Dockerfile
# Stage 1: Build
FROM node:20 as build

WORKDIR /app
COPY package.json yarn.lock* package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
# Default Nginx config usually works, but a custom one is better for React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
