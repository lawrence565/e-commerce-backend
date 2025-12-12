FROM node:20

WORKDIR /app

COPY package.json tsconfig.json coupon.json ./
COPY src ./src

RUN npm install

EXPOSE 8080

CMD ["npm", "run", "dev"]
