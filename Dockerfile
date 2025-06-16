# Build aşaması
FROM node:20-alpine as build

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Uygulamayı derle
RUN npm run build

# Çalışma aşaması
FROM nginx:alpine

# Nginx yapılandırmasını kopyala
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Build edilmiş dosyaları kopyala
COPY --from=build /app/dist /usr/share/nginx/html

# 80 portunu aç
EXPOSE 80

# Nginx'i başlat
CMD ["nginx", "-g", "daemon off;"] 