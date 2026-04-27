# WhatsApp Bot - Investigalo Detectives

Bot de WhatsApp con IA (Gemini) para atención 24/7 de clientes de Investigalo Detectives.

## Requisitos previos

- Node.js 18+
- Cuenta de Meta Business con WhatsApp Cloud API configurada
- API Key de Google Gemini (plan Pro)
- App ntfy instalada en tu móvil (Google Play / F-Droid)
- VPS en Hetzner con IP pública
- Dominio o subdominio apuntando a tu VPS (necesario para HTTPS del webhook)

---

## 1. Configurar WhatsApp Cloud API

1. Ve a [developers.facebook.com](https://developers.facebook.com)
2. Crea una app tipo "Business"
3. Añade el producto "WhatsApp"
4. En WhatsApp > API Setup:
   - Copia el **Phone number ID** → será tu `WHATSAPP_PHONE_ID`
   - Genera un **token permanente** → será tu `WHATSAPP_TOKEN`
5. Vincula tu número de WhatsApp Business existente

## 2. Obtener API Key de Gemini

1. Ve a [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Crea una API Key → será tu `GEMINI_API_KEY`

## 3. Configurar ntfy (alertas urgentes)

1. Instala la app **ntfy** en tu móvil desde Google Play o F-Droid
2. Abre la app y suscríbete a un canal con nombre secreto (ej: `investigalo-urgencias-abc123`)
3. En ajustes de la suscripción, activa "Permitir prioridad máxima" para que suene en silencio
4. Ese nombre de canal será tu `NTFY_TOPIC`

## 4. Preparar el servidor Hetzner

```bash
# Conectar al VPS
ssh root@TU_IP_HETZNER

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar nginx y certbot (para HTTPS)
sudo apt install -y nginx certbot python3-certbot-nginx

# Crear directorio del proyecto
mkdir -p /opt/whatsapp-bot
cd /opt/whatsapp-bot
```

## 5. Subir y configurar el proyecto

```bash
# Opción A: clonar desde tu repositorio git
# Opción B: copiar archivos con scp
scp -r ./* root@TU_IP_HETZNER:/opt/whatsapp-bot/

# En el servidor:
cd /opt/whatsapp-bot
npm install

# Crear archivo .env (copiar de .env.example y rellenar)
cp .env.example .env
nano .env
```

## 6. Configurar HTTPS con Nginx

El webhook de WhatsApp requiere HTTPS. Configura nginx como proxy inverso:

```bash
sudo nano /etc/nginx/sites-available/whatsapp-bot
```

Contenido:
```nginx
server {
    server_name tudominio.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Obtener certificado SSL gratuito
sudo certbot --nginx -d tudominio.com
```

## 7. Ejecutar como servicio (systemd)

```bash
sudo nano /etc/systemd/system/whatsapp-bot.service
```

Contenido:
```ini
[Unit]
Description=WhatsApp Bot Investigalo Detectives
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/whatsapp-bot
ExecStart=/usr/bin/node src/index.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-bot
sudo systemctl start whatsapp-bot

# Ver logs en tiempo real
sudo journalctl -u whatsapp-bot -f
```

## 8. Configurar el Webhook en Meta

1. En Meta Developers > WhatsApp > Configuration
2. Callback URL: `https://tudominio.com/webhook`
3. Verify token: el que pusiste en `WHATSAPP_VERIFY_TOKEN` de tu .env
4. Suscríbete al campo: `messages`

## 9. Verificar que funciona

```bash
# Comprobar que el servidor responde
curl https://tudominio.com/health

# Debería devolver: {"status":"ok","timestamp":"...","uptime":...}
```

Envía un mensaje de prueba al número de WhatsApp Business y verifica que el bot responde.

---

## Estructura del proyecto

```
whatsapp-bot-detectives/
├── .env.example      # Variables de entorno (plantilla)
├── package.json      # Dependencias
├── README.md         # Esta guía
└── src/
    ├── index.js      # Servidor Express + lógica principal
    ├── whatsapp.js   # Envío/recepción de mensajes WhatsApp
    ├── gemini.js     # Integración con Gemini AI
    ├── prompt.js     # Prompt de sistema (personalidad del bot)
    ├── schedule.js   # Control de horarios
    └── ntfy.js       # Alertas urgentes vía ntfy.sh
```

## Comandos útiles

```bash
# Ver logs
sudo journalctl -u whatsapp-bot -f

# Reiniciar bot
sudo systemctl restart whatsapp-bot

# Parar bot
sudo systemctl stop whatsapp-bot

# Ver estado
sudo systemctl status whatsapp-bot
```

## Coste mensual estimado

- Hetzner VPS (CX22): ~4,50€/mes
- WhatsApp Cloud API: ~5-15€/mes (según volumen)
- Gemini API (Plan Pro): incluido en tu suscripción
- ntfy.sh: gratis

**Total estimado: 10-20€/mes**
