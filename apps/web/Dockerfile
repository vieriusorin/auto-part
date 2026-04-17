FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -w @autocare/web
EXPOSE 3000
CMD ["npm", "run", "start", "-w", "@autocare/web"]
