FROM node:10.15-alpine
RUN mkdir /app
WORKDIR /app
ADD package*.json /app/
RUN npm install
ADD . /app/
CMD [ "npm", "run", "start" ]
