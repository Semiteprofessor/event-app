# FROM node:20-alpine
# WORKDIR /app
# COPY package.json package-lock.json ./
# RUN npm ci --production
# COPY . .
# RUN npx prisma generate
# RUN npm run build
# EXPOSE 4000
# CMD ["node", "dist/index.js"]

FROM node:18-alpine as builder

WORKDIR /usr/src/app

RUN apk add --no-cache bash make gcc g++ python3

COPY package*.json ./
RUN npm install && \
    npm rebuild bcrypt && \
    apk del make gcc g++ python3

COPY . .

RUN npm run build

FROM node:18-alpine

WORKDIR /usr/src/app

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/package-lock.json ./
#COPY --from=builder /usr/src/app/src ./src

COPY --from=builder /usr/src/app/scripts/start.sh ./start.sh
RUN chmod +x ./start.sh

RUN npm ci --omit=dev


EXPOSE 5000

ENTRYPOINT ["./start.sh"]
