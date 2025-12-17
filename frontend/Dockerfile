# --- שלב build (לא Alpine) ---
FROM node:20-bullseye-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build


# --- שלב run (nginx) ---
FROM nginx:alpine

# ניקוי ברירת מחדל
RUN rm -rf /usr/share/nginx/html/*

# העתקת ה-build
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
