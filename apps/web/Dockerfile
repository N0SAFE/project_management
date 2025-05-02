# Web Dockerfile
FROM node:slim as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:slim
WORKDIR /app
COPY --from=build /app/dist/web ./dist/web
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/src/server.ts ./src/server.ts
EXPOSE 4000
CMD ["node", "dist/web/server/server.mjs"]
