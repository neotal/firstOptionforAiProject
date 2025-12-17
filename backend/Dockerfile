# בסיס יציב
FROM node:20-alpine

# תיקיית עבודה בתוך הקונטיינר
WORKDIR /app

# קודם package.json כדי לנצל cache
COPY package*.json ./

RUN npm install

# העתקת קוד
COPY . .

# פורט של הבקאנד
EXPOSE 3000

# הרצה
CMD ["node", "src/server.js"]
