FROM node:8 as dev

RUN mkdir /app
COPY . /app/
WORKDIR /app
EXPOSE 4444

RUN yarn install
CMD ["npm", "start"]

FROM dev as prod
WORKDIR /app
ENV NODE_ENV=production

RUN npm run build
CMD ["npm", "run", "start"]
