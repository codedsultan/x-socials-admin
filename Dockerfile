# syntax=docker/dockerfile:1.5
ARG PHP_VERSION=8.5

####################################
# Stage 1: Build app deps + frontend
####################################
FROM serversideup/php:${PHP_VERSION}-fpm-nginx AS builder

ENV APP_BASE_DIR=/var/www/html
WORKDIR ${APP_BASE_DIR}

USER root

# PHP extensions required by BlogOS
RUN install-php-extensions intl pcntl redis exif bcmath

# Install Node 22 LTS via NodeSource (includes npm) + pnpm via corepack.
# Debian's default nodejs package does NOT bundle npm — NodeSource does.
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y --no-install-recommends nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    corepack enable && \
    corepack prepare pnpm@10.32.1 --activate
# corepack prepare pnpm@latest --activate

# Copy dependency manifests first (layer cache — only invalidated when these change)
COPY composer.json composer.lock ./
COPY package.json pnpm-lock.yaml ./
# COPY .npmrc ./

# Install PHP dependencies WITHOUT --optimize-autoloader.
# The post-autoload-dump hook requires app source files that don't exist yet.
# We re-dump with full optimization after COPY . . below.
RUN --mount=type=cache,target=/root/.composer \
    composer install \
    --no-dev \
    --prefer-dist \
    --no-interaction \
    --no-autoloader


# Install Node dependencies via pnpm
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
# RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
#     pnpm install --frozen-lockfile --no-ignore-scripts
# Copy full app source — now helpers.php and everything else exists
COPY . .

# Dump optimized autoloader now that all source files are present
RUN composer dump-autoload --optimize --no-dev

# Build-time arguments for Vite baked-in values
ARG VITE_APP_NAME
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST
ARG VITE_REVERB_PORT
ARG VITE_REVERB_SCHEME

ENV VITE_APP_NAME=${VITE_APP_NAME} \
    VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY} \
    VITE_REVERB_HOST=${VITE_REVERB_HOST} \
    VITE_REVERB_PORT=${VITE_REVERB_PORT} \
    VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME}

# Build frontend assets
RUN pnpm run build

####################################
# Stage 2: Production image
####################################
FROM serversideup/php:${PHP_VERSION}-fpm-nginx AS production

ENV APP_BASE_DIR=/var/www/html \
    SSL_MODE=off \
    PHP_OPCACHE_ENABLE=1 \
    HEALTHCHECK_PATH=/healthcheck

WORKDIR ${APP_BASE_DIR}
USER root

# PHP extensions (must repeat — fresh base layer)
RUN install-php-extensions intl pcntl redis exif bcmath

# Copy fully built app from builder (includes optimized autoloader + built assets)
COPY --from=builder /var/www/html ${APP_BASE_DIR}

# Ensure storage + bootstrap/cache are writable at runtime
RUN mkdir -p \
    ${APP_BASE_DIR}/storage/logs \
    ${APP_BASE_DIR}/bootstrap/cache \
    && chown -R www-data:www-data \
    ${APP_BASE_DIR}/storage \
    ${APP_BASE_DIR}/bootstrap/cache \
    && chmod -R ug+rwx \
    ${APP_BASE_DIR}/storage \
    ${APP_BASE_DIR}/bootstrap/cache

# Reverb runs on 8081 — NOT 8080.
# serversideup/php base image already binds Nginx on 8080.
# Caddy routes WebSocket upgrades → 8081, plain HTTP → 8080.
RUN mkdir -p /etc/services.d/reverb && \
    printf '#!/bin/bash\nset -e\ncd /var/www/html\nexec php artisan reverb:start --host=0.0.0.0 --port=8081\n' \
    > /etc/services.d/reverb/run && \
    chmod +x /etc/services.d/reverb/run

USER www-data

# 8080 = Nginx/PHP-FPM (HTTP)   8081 = Reverb (WebSocket)
EXPOSE 8080 8081

HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
    CMD curl -f http://localhost:8080${HEALTHCHECK_PATH} || exit 1
