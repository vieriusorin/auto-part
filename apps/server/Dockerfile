FROM node:22-alpine AS base
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build -w @autocare/server
EXPOSE 4000
CMD ["npm", "run", "start", "-w", "@autocare/server"]
