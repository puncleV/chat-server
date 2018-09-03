FROM node:8

RUN mkdir /app
COPY . /app/
COPY config.sample.js ./app/config.js
WORKDIR /app
EXPOSE 1734

RUN yarn install

ENV NODE_ENV=production
ENV MONGO_URL='mongodb://mongo:27017'

RUN npm run build
CMD ["npm", "run", "start"]
