# ⚡ GUIA RÁPIDO: DNS Direto + SSL (Sem Cloudflare)

## 🎯 O QUE FAZER

**2 passos simples:**
1. DNS no GoDaddy → IP da AWS
2. SSL no servidor AWS (Nginx + Let's Encrypt)

**Tempo total: ~35 minutos**

---

## 📍 PASSO 1: DNS (5 minutos)

### No GoDaddy (ou seu DNS):

1. Login → My Products → Domains
2. pharmyrus.com → Manage DNS
3. **Adicionar/Editar registro A:**
   ```
   Type: A
   Name: api
   Value: 3.238.157.167
   TTL: 600
   ```
4. Save
5. Aguardar 5-30 min
6. Testar: `nslookup api.pharmyrus.com`

---

## 🔐 PASSO 2: SSL no Servidor (30 minutos)

### Conectar no servidor:
```bash
ssh -i sua-chave.pem ubuntu@3.238.157.167
```

### Instalar Nginx + Certbot:
```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Abrir portas no AWS Console:
```
EC2 → Security Groups → Edit Inbound Rules
Adicionar:
  - Port 80 (HTTP) - 0.0.0.0/0
  - Port 443 (HTTPS) - 0.0.0.0/0
```

### Obter certificado SSL:
```bash
sudo certbot --nginx -d api.pharmyrus.com
```

Responder:
- Email: seu@email.com
- Terms: Y
- Share: N
- Redirect: 2 (Yes)

### Configurar Nginx como proxy:
```bash
sudo nano /etc/nginx/sites-available/pharmyrus-api
```

Colar:
```nginx
server {
    listen 80;
    server_name api.pharmyrus.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.pharmyrus.com;

    ssl_certificate /etc/letsencrypt/live/api.pharmyrus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pharmyrus.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Timeouts 12 minutos
    proxy_connect_timeout 720s;
    proxy_send_timeout 720s;
    proxy_read_timeout 720s;
    
    # CORS
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
    
    location / {
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Salvar: CTRL+X, Y, Enter

### Ativar:
```bash
sudo ln -s /etc/nginx/sites-available/pharmyrus-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Testar:
```bash
curl https://api.pharmyrus.com/api/v1/health
```

---

## 🔧 PASSO 3: Atualizar Frontend (1 minuto)

Editar `js/dashboard.js` linha 9:
```javascript
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

Deploy Netlify.

---

## ✅ PRONTO!

```
✅ DNS: api.pharmyrus.com → 3.238.157.167
✅ HTTPS: Let's Encrypt (grátis)
✅ Nginx: Proxy reverso
✅ Timeout: 12 minutos
✅ CORS: Configurado
✅ Frontend: Atualizado
```

---

## 🆘 TROUBLESHOOTING RÁPIDO

### DNS não propaga:
```bash
# Aguardar até 1 hora
# Testar: nslookup api.pharmyrus.com 8.8.8.8
```

### Certbot falha:
```bash
# Verificar DNS propagou
# Verificar porta 80 aberta no AWS
# Aguardar 10 min e tentar novamente
```

### Nginx erro:
```bash
sudo nginx -t  # Ver erro
sudo tail -f /var/log/nginx/error.log  # Ver logs
```

### API não responde:
```bash
# Verificar API rodando:
curl http://localhost:8000/api/v1/health

# Ver processos:
ps aux | grep uvicorn
```

---

## 📊 COMPARAÇÃO

| Método | Tempo | Servidor | CDN | Custo |
|--------|-------|----------|-----|-------|
| **DNS Direto** | 35 min | ✅ Sim | ❌ Não | Grátis |
| **Cloudflare** | 5 min | ❌ Não | ✅ Sim | Grátis |

Você escolheu: **DNS Direto** ✅

---

## 🎯 CHECKLIST

- [ ] DNS configurado no GoDaddy
- [ ] DNS propagado (nslookup)
- [ ] Portas 80/443 abertas no AWS
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Certificado SSL obtido
- [ ] Configuração Nginx criada
- [ ] Nginx reload OK
- [ ] API responde em HTTPS
- [ ] Frontend atualizado
- [ ] Deploy Netlify
- [ ] Tudo funcionando!

---

**Ver guia completo:** `GUIA_DNS_DIRETO_SSL.md`

**Tempo total:** ~35 minutos  
**Custo:** R$ 0,00  
**Controle:** 100% seu
