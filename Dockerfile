FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENV NEXT_PUBLIC_API_URL=https://andyfers-api.diagsa.cloud
ENV NEXT_PUBLIC_SITE_URL=https://andyfers.diagsa.cloud
ENV NEXT_PUBLIC_PUBLIC_URL=https://andyfers.diagsa.cloud
ENV NEXT_PUBLIC_CONTACT_WHATSAPP=2380000000
ENV NEXT_PUBLIC_CONTACT_EMAIL=ventas@andyfers.com
ENV NEXT_PUBLIC_CONTACT_CITY="Tehuacán, Puebla"
ENV NEXT_PUBLIC_HOME_VIDEO_URL=https://rmicjlvxwgzocuymlouv.supabase.co/storage/v1/object/public/andyfers/Andyfers.mp4
ENV NEXT_PUBLIC_HOME_VIDEO_POSTER_URL=https://rmicjlvxwgzocuymlouv.supabase.co/storage/v1/object/public/andyfers/Andyfers.mp4

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
