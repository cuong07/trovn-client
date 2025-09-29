FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Copy .env file trước
COPY .env .env

# Copy source code
COPY . .

# Build ứng dụng (Vite sẽ đọc .env file ở đây)
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist

COPY --from=build /app/package*.json ./

RUN npm install -g serve

EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5174"]
