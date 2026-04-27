#!/bin/bash
# ==============================================
# CONFIGURAR NGINX + HTTPS PARA EL BOT
# Ejecutar DESPUÉS de apuntar el subdominio a la IP
# ==============================================

set -e

read -p "Introduce tu subdominio (ej: bot.investigalo-detectives.com): " DOMAIN

echo "[1/3] Configurando nginx..."
cat > /etc/nginx/sites-available/whatsapp-bot << NGINXEOF
server {
    server_name ${DOMAIN};
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
echo "✅ Nginx configurado"

echo "[2/3] Instalando certificado SSL..."
sudo apt-get install -y certbot python3-certbot-nginx > /dev/null 2>&1
sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos -m ds.qnk.88@gmail.com
echo "✅ HTTPS activado"

echo "[3/3] Iniciando bot..."
sudo systemctl restart whatsapp-bot

echo ""
echo "=========================================="
echo " ✅ TODO LISTO"
echo "=========================================="
echo " Bot activo en: https://${DOMAIN}/webhook"
echo " Health check:  https://${DOMAIN}/health"
echo ""
echo " Configura el webhook en Meta con:"
echo " URL: https://${DOMAIN}/webhook"
echo " Verify Token: investigalo_secreto_2026"
echo "=========================================="
