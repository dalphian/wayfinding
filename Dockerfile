# ── Hospital Wayfinding App ──────────────────────────────────────
# Lightweight nginx container serving a single-page HTML app
# Access at: http://10.0.1.236:3265
# QR Admin:  http://10.0.1.236:3265/admin
# ─────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/wayfinding.conf

# Copy app files
COPY ./html/ /usr/share/nginx/html/

# Expose the custom port
EXPOSE 3265

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3265/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
