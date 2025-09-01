FROM node:20-alpine
WORKDIR /app
COPY package.json tsconfig.json next.config.js tailwind.config.ts postcss.config.js .
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY styles ./styles
RUN npm install --production
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
