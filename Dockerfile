# 构建阶段：安装依赖并产出静态文件
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# 测试阶段：docker compose --profile test run --rm test
FROM node:20-alpine AS test
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
CMD ["npm", "test"]

# 运行阶段：nginx 托管静态站点，运行时完全离线
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
