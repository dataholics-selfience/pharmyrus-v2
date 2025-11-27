# 🔐 Guia para CTO: Adicionar HTTPS no Backend API

## 📋 Contexto

**Problema atual:**
- Frontend: HTTPS (Netlify)
- Backend API: HTTP (3.238.157.167:8000)
- Navegadores bloqueiam requisições HTTP de páginas HTTPS

**Solução temporária:**
- Netlify Function como proxy (timeout 26s no Free)

**Solução definitiva:**
- Backend com certificado SSL/TLS
- Frontend chama API direto via HTTPS
- Sem limites de timeout

---

## 🎯 OBJETIVO

Adicionar HTTPS ao backend em:
```
http://3.238.157.167:8000/api/v1/search
↓
https://api.pharmyrus.com/api/v1/search
(ou)
https://3.238.157.167:8000/api/v1/search
```

---

## 🚀 OPÇÕES DE IMPLEMENTAÇÃO

### Opção 1: Certificado Let's Encrypt (GRÁTIS - RECOMENDADO)

**Vantagens:**
- ✅ Completamente gratuito
- ✅ Renovação automática
- ✅ Amplamente suportado
- ✅ Fácil de implementar

**Stack FastAPI + Uvicorn:**

#### 1. Instalar Certbot
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Amazon Linux / CentOS
sudo yum install certbot python3-certbot-nginx
```

#### 2. Obter certificado
```bash
# Se tem domínio (api.pharmyrus.com)
sudo certbot certonly --standalone -d api.pharmyrus.com

# Se usar apenas IP (3.238.157.167)
# Não funciona - Let's Encrypt requer domínio!
# Ver Opção 2 abaixo
```

#### 3. Configurar Uvicorn com SSL
```python
# main.py
import uvicorn
from fastapi import FastAPI

app = FastAPI()

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        ssl_keyfile="/etc/letsencrypt/live/api.pharmyrus.com/privkey.pem",
        ssl_certfile="/etc/letsencrypt/live/api.pharmyrus.com/fullchain.pem",
        reload=False
    )
```

#### 4. Renovação automática
```bash
# Adicionar cron job
sudo crontab -e

# Adicionar linha:
0 0 * * 0 certbot renew --quiet && systemctl restart your-api-service
```

---

### Opção 2: Nginx como Reverse Proxy (RECOMENDADO)

**Vantagens:**
- ✅ Melhor performance
- ✅ Load balancing
- ✅ Caching
- ✅ Proteção DDoS
- ✅ Funciona com IP ou domínio

**Arquitetura:**
```
Internet → Nginx (443/HTTPS) → FastAPI (8000/HTTP)
```

#### 1. Instalar Nginx
```bash
sudo apt update
sudo apt install nginx
```

#### 2. Obter certificado Let's Encrypt
```bash
# Com domínio
sudo certbot --nginx -d api.pharmyrus.com

# OU gerar self-signed para testes
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/nginx-selfsigned.key \
  -out /etc/ssl/certs/nginx-selfsigned.crt
```

#### 3. Configurar Nginx
```nginx
# /etc/nginx/sites-available/pharmyrus-api
server {
    listen 80;
    server_name api.pharmyrus.com;
    
    # Redirecionar HTTP → HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.pharmyrus.com;

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/api.pharmyrus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pharmyrus.com/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Timeouts longos para API lenta (10 minutos)
    proxy_connect_timeout 600s;
    proxy_send_timeout 600s;
    proxy_read_timeout 600s;
    send_timeout 600s;
    
    # Proxy para FastAPI
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }
    
    # Logs
    access_log /var/log/nginx/pharmyrus-api-access.log;
    error_log /var/log/nginx/pharmyrus-api-error.log;
}
```

#### 4. Ativar e testar
```bash
# Criar symlink
sudo ln -s /etc/nginx/sites-available/pharmyrus-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Verificar status
sudo systemctl status nginx
```

#### 5. Firewall
```bash
# Permitir HTTPS
sudo ufw allow 443/tcp

# Remover acesso direto HTTP (opcional)
sudo ufw deny 8000/tcp
```

---

### Opção 3: Cloudflare SSL (GRÁTIS + CDN)

**Vantagens:**
- ✅ Completamente gratuito
- ✅ CDN global incluído
- ✅ Proteção DDoS
- ✅ Cache automático
- ✅ Setup em 5 minutos

**Passos:**

#### 1. Criar conta Cloudflare
- Ir para https://dash.cloudflare.com/sign-up
- Adicionar domínio `pharmyrus.com`

#### 2. Configurar DNS
```
Tipo: A
Nome: api
Conteúdo: 3.238.157.167
Proxy: ✅ Enabled (laranja)
```

#### 3. Configurar SSL/TLS
- SSL/TLS → Overview → Full (strict)
- Edge Certificates → Always Use HTTPS: ON

#### 4. Pronto!
```
http://3.238.157.167:8000 → mantém HTTP interno
https://api.pharmyrus.com → HTTPS externo
```

Cloudflare faz terminação SSL e proxia para seu backend HTTP.

---

### Opção 4: AWS ALB/ELB (se usando AWS)

**Vantagens:**
- ✅ Integrado com AWS
- ✅ Auto-scaling
- ✅ Health checks
- ✅ Certificado ACM grátis

**Custos:**
- ⚠️ ~$20/mês + tráfego

**Setup:**
1. Criar Application Load Balancer
2. Gerar certificado AWS ACM
3. Configurar listener 443 → target group 8000
4. Atualizar security groups

---

## 🎯 RECOMENDAÇÃO FINAL

### Para Produção: Opção 2 (Nginx + Let's Encrypt)

**Por quê?**
1. ✅ Grátis e open source
2. ✅ Performance excelente
3. ✅ Flexibilidade total
4. ✅ Suporte a timeouts longos (10+ min)
5. ✅ Amplamente usado e documentado

**Setup rápido:**
```bash
# 1. Instalar Nginx e Certbot
sudo apt install nginx certbot python3-certbot-nginx

# 2. Obter certificado
sudo certbot --nginx -d api.pharmyrus.com

# 3. Configurar proxy (ver config acima)
sudo nano /etc/nginx/sites-available/pharmyrus-api

# 4. Ativar
sudo ln -s /etc/nginx/sites-available/pharmyrus-api /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Testar
curl -I https://api.pharmyrus.com/api/v1/health
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Pré-requisitos
- [ ] Servidor com IP público (3.238.157.167)
- [ ] Domínio apontando para o IP (api.pharmyrus.com)
- [ ] Porta 443 liberada no firewall
- [ ] FastAPI rodando na porta 8000

### Implementação
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Certificado SSL gerado
- [ ] Nginx configurado como proxy
- [ ] Timeouts ajustados (600s)
- [ ] CORS headers adicionados
- [ ] Firewall atualizado (443 open)
- [ ] Renovação automática configurada

### Testes
- [ ] `curl -I https://api.pharmyrus.com/api/v1/health`
- [ ] Browser: `https://api.pharmyrus.com/api/v1/search?molecule_name=test`
- [ ] Verificar HTTPS válido (cadeado verde)
- [ ] Testar timeout longo (busca real 10+ min)
- [ ] Verificar CORS funcionando

### Frontend Update
- [ ] Atualizar dashboard.js:
  ```javascript
  // Remover Netlify Function
  const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
  ```
- [ ] Remover netlify/functions/api-search.js
- [ ] Testar do site Netlify (HTTPS → HTTPS)

---

## 🔄 APÓS IMPLEMENTAR HTTPS

### No Frontend (dashboard.js):
```javascript
// ANTES (com Netlify Function)
const API_BASE_URL = '/.netlify/functions/api-search';
const apiUrl = `${API_BASE_URL}?molecule_name=${moleculeName}`;

// DEPOIS (direto para API HTTPS)
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
const apiUrl = `${API_BASE_URL}/search?molecule_name=${moleculeName}`;
```

### Benefícios:
- ✅ Sem timeout de 26s (Netlify Function)
- ✅ Conexão direta mais rápida
- ✅ Sem intermediário
- ✅ Logs no próprio servidor
- ✅ Mais controle sobre performance

---

## 📞 SUPORTE

**Documentação:**
- Nginx: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/docs/
- Certbot: https://certbot.eff.org/

**Troubleshooting:**
```bash
# Verificar Nginx rodando
sudo systemctl status nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log

# Testar configuração
sudo nginx -t

# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --dry-run
```

---

## ⏱️ ESTIMATIVA DE TEMPO

- Setup Nginx + Let's Encrypt: **30-60 minutos**
- Testes: **15 minutos**
- Frontend update: **5 minutos**
- **Total: ~1-2 horas**

---

## 🎯 RESULTADO FINAL

```
✅ Backend com HTTPS válido
✅ Frontend chama API direto
✅ Sem timeout (conexão nativa)
✅ Sem Mixed Content errors
✅ Certificado renovando automaticamente
✅ Sistema pronto para produção
```

---

**Qualquer dúvida, estou à disposição!** 🚀
