FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Accept build args and set as ENV for Next.js build
ARG NEXT_PUBLIC_WLD_APP_ID
ENV NEXT_PUBLIC_WLD_APP_ID=$NEXT_PUBLIC_WLD_APP_ID

# Build for production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
