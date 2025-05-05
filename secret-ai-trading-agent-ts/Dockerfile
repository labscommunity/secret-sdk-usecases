
FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN apk add --no-cache make gcc g++ python3 curl
RUN apk add --no-cache py3-setuptools
RUN apk add --no-cache sqlite-libs

RUN pnpm install --frozen-lockfile

COPY . .

RUN cd ./node_modules/sqlite3 && npm run rebuild --ignore-scripts

CMD [ "pnpm", "run", "dev" ]