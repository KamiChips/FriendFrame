FROM node:22-alpine AS base
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci
COPY . .

FROM base AS test
ENV CI=true
CMD ["npm", "run", "test:ci"]

FROM base AS build-web

ARG EXPO_PUBLIC_SUPABASE_URL
ARG EXPO_PUBLIC_SUPABASE_KEY
RUN npx expo export --platform web

FROM nginx:alpine AS web
COPY --from=build-web /app/dist /usr/share/nginx/html
EXPOSE 80