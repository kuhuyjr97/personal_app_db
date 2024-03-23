FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf
COPY conf/mime.types /var/nginx/mime.types