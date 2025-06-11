FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY .env.production .env.production
COPY . .
RUN npm run build -- --mode production

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8888
