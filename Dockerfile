FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

ENV PORT=8080

CMD ["npm", "run", "start:prod"]

EXPOSE 8080
