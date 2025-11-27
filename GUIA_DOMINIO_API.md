# 🌐 Como Apontar api.pharmyrus.com para API na AWS

## 📋 Situação Atual

```
Frontend: pharmyrus-dashboard-v2.netlify.app (HTTPS)
Backend: 3.238.157.167:8000 (HTTP)
Objetivo: api.pharmyrus.com → 3.238.157.167:8000 (HTTPS)
```

---

## 🎯 PASSO A PASSO COMPLETO

### **PASSO 1: Configurar DNS** (5 minutos)

Você precisa criar um registro DNS apontando `api.pharmyrus.com` para o IP da AWS.

#### **Onde configurar:**
No seu provedor de domínio (GoDaddy, Registro.br, Namecheap, etc.)

#### **Opção A: Registro A (Recomendado)**

1. Acesse o painel DNS do seu domínio `pharmyrus.com`
2. Adicione um registro **A**:
   ```
   Tipo: A
   Nome: api
   Valor: 3.238.157.167
   TTL: 3600 (1 hora)
   ```

3. Salvar

4. Aguardar propagação (5 min a 48h, geralmente 15 min)

#### **Opção B: Registro CNAME** (se tiver nome do servidor AWS)

Se sua instância AWS tem um nome DNS tipo `ec2-3-238-157-167.compute-1.amazonaws.com`:

```
Tipo: CNAME
Nome: api
Valor: ec2-3-238-157-167.compute-1.amazonaws.com
TTL: 3600
```

#### **Verificar configuração:**

Após configurar, teste no terminal:

```bash
# Esperar alguns minutos e testar:
nslookup api.pharmyrus.com

# Deve retornar:
# Name:    api.pharmyrus.com
# Address: 3.238.157.167
```

Ou:

```bash
ping api.pharmyrus.com
# Deve pingar 3.238.157.167
```

---

### **PASSO 2: Configurar SSL/TLS no Servidor AWS** (30-60 min)

Agora você precisa adicionar HTTPS no backend.

#### **Opção A: Cloudflare (MAIS FÁCIL - 5 minutos)** ⭐ RECOMENDADO

**Vantagens:**
- ✅ SSL automático e grátis
- ✅ CDN global
- ✅ Proteção DDoS
- ✅ Não mexe no servidor
- ✅ Setup em 5 minutos

**Passos:**

1. **Criar conta Cloudflare** (grátis):
   - https://dash.cloudflare.com/sign-up

2. **Adicionar domínio `pharmyrus.com`:**
   - Add a Site → pharmyrus.com
   - Cloudflare vai escanear seus DNS

3. **Importar registros existentes:**
   - Cloudflare mostra todos os registros atuais
   - Confirmar tudo está correto

4. **Adicionar/Editar registro para API:**
   ```
   Tipo: A
   Nome: api
   IPv4: 3.238.157.167
   Proxy status: ✅ Proxied (nuvem laranja)
   ```
   
   ⚠️ **IMPORTANTE: Proxy LIGADO (laranja)!**

5. **Atualizar Nameservers no seu registrador:**
   - Cloudflare vai dar 2 nameservers tipo:
     ```
     ada.ns.cloudflare.com
     chad.ns.cloudflare.com
     ```
   - Ir no painel do seu registrador de domínio
   - Trocar os nameservers atuais pelos da Cloudflare
   - Salvar

6. **Aguardar propagação** (até 24h, geralmente 1h)

7. **Configurar SSL na Cloudflare:**
   - SSL/TLS → Overview
   - Encryption mode: **Full (não strict)**
   - ⚠️ Use "Full", não "Full (strict)" porque seu backend ainda é HTTP

8. **Configurar HTTPS obrigatório:**
   - SSL/TLS → Edge Certificates
   - Always Use HTTPS: **ON**
   - Automatic HTTPS Rewrites: **ON**

9. **Testar:**
   ```bash
   curl https://api.pharmyrus.com/api/v1/health
   # Deve funcionar!
   ```

**Pronto! 🎉**

Com Cloudflare:
- `http://api.pharmyrus.com` → redireciona para HTTPS
- `https://api.pharmyrus.com` → Cloudflare (HTTPS) → seu servidor (HTTP)
- Seu servidor continua HTTP interno
- Cloudflare faz terminação SSL

---

#### **Opção B: Nginx + Let's Encrypt** (60 minutos)

**Vantagens:**
- ✅ Controle total
- ✅ Grátis
- ✅ Performance excelente

**Desvantagens:**
- ⚠️ Precisa mexer no servidor
- ⚠️ Mais complexo

**Passos:**

1. **Conectar no servidor AWS:**
   ```bash
   ssh -i sua-chave.pem ubuntu@3.238.157.167
   ```

2. **Instalar Nginx:**
   ```bash
   sudo apt update
   sudo apt install nginx -y
   ```

3. **Instalar Certbot (Let's Encrypt):**
   ```bash
   sudo apt install certbot python3-certbot-nginx -y
   ```

4. **Obter certificado SSL:**
   ```bash
   sudo certbot --nginx -d api.pharmyrus.com
   
   # Responder:
   # Email: seu@email.com
   # Agree ToS: Yes
   # Share email: No/Yes (tanto faz)
   # Redirect HTTP to HTTPS: 2 (Yes)
   ```

5. **Configurar Nginx como proxy:**
   ```bash
   sudo nano /etc/nginx/sites-available/pharmyrus-api
   ```

   Colar:
   ```nginx
   server {
       listen 80;
       server_name api.pharmyrus.com;
       
       # Certbot vai adicionar redirecionamento HTTPS aqui
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name api.pharmyrus.com;

       # Certificados SSL (Certbot adiciona automaticamente)
       ssl_certificate /etc/letsencrypt/live/api.pharmyrus.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/api.pharmyrus.com/privkey.pem;
       
       # Configurações SSL modernas
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       ssl_prefer_server_ciphers on;
       
       # Timeouts longos (12 minutos)
       proxy_connect_timeout 720s;
       proxy_send_timeout 720s;
       proxy_read_timeout 720s;
       send_timeout 720s;
       
       # CORS headers
       add_header 'Access-Control-Allow-Origin' '*' always;
       add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
       add_header 'Access-Control-Allow-Headers' 'Content-Type' always;
       
       # Proxy para sua API FastAPI
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

6. **Ativar configuração:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/pharmyrus-api /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

7. **Configurar renovação automática:**
   ```bash
   sudo systemctl status certbot.timer
   # Deve estar ativo
   ```

8. **Abrir porta 443 no firewall AWS:**
   - AWS Console → EC2 → Security Groups
   - Editar Inbound Rules
   - Adicionar:
     ```
     Type: HTTPS
     Protocol: TCP
     Port: 443
     Source: 0.0.0.0/0
     ```

9. **Testar:**
   ```bash
   curl https://api.pharmyrus.com/api/v1/health
   ```

---

### **PASSO 3: Atualizar Frontend** (2 minutos)

Editar `dashboard.js`:

```javascript
// Linha ~9
// ANTES:
const API_BASE_URL = 'http://3.238.157.167:8000/api/v1';

// DEPOIS:
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

Fazer novo deploy no Netlify.

---

### **PASSO 4: Testar Tudo** (5 minutos)

#### **1. Teste DNS:**
```bash
nslookup api.pharmyrus.com
# Deve retornar: 3.238.157.167
```

#### **2. Teste SSL:**
```bash
curl -I https://api.pharmyrus.com
# Deve retornar: HTTP/2 200 ou HTTP/1.1 200
```

#### **3. Teste API:**
```bash
curl https://api.pharmyrus.com/api/v1/search?molecule_name=paracetamol
# Deve retornar JSON da API (depois de 3-12 min)
```

#### **4. Teste no Frontend:**
- Abrir site Netlify
- Fazer login
- Buscar molécula
- Verificar console (F12):
  ```
  ✅ Calling API directly (HTTP): https://api.pharmyrus.com/api/v1/search...
  ✅ API response received
  ```

---

## 🎯 RESUMO DAS OPÇÕES

### **Cloudflare (RECOMENDADO):**
```
✅ Mais fácil (5 minutos)
✅ Não mexe no servidor
✅ SSL automático
✅ CDN grátis
✅ DDoS protection
✅ Cache inteligente
```

**Setup:**
1. Cloudflare → Add Site
2. Adicionar registro A (proxy ON)
3. Mudar nameservers
4. Configurar SSL "Full"
5. Pronto!

### **Nginx + Let's Encrypt:**
```
✅ Controle total
✅ Performance máxima
✅ Grátis
⚠️ Mais complexo
⚠️ Precisa acesso SSH
```

**Setup:**
1. SSH no servidor
2. Instalar Nginx + Certbot
3. Obter certificado
4. Configurar proxy
5. Abrir porta 443
6. Pronto!

---

## 🔍 TROUBLESHOOTING

### DNS não propaga
```bash
# Limpar cache DNS local:
# Windows:
ipconfig /flushdns

# Mac:
sudo dscacheutil -flushcache

# Linux:
sudo systemd-resolve --flush-caches

# Testar em outro DNS:
nslookup api.pharmyrus.com 8.8.8.8
```

### SSL não funciona
```bash
# Verificar certificado:
openssl s_client -connect api.pharmyrus.com:443

# Se usar Cloudflare:
# - Verificar Proxy Status está ON (laranja)
# - Verificar SSL mode está "Full"

# Se usar Let's Encrypt:
sudo certbot certificates
sudo systemctl status nginx
```

### CORS errors
```nginx
# Adicionar no Nginx:
add_header 'Access-Control-Allow-Origin' '*' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Content-Type' always;

if ($request_method = 'OPTIONS') {
    return 204;
}
```

### Timeout errors
```nginx
# Aumentar timeouts no Nginx:
proxy_connect_timeout 720s;
proxy_send_timeout 720s;
proxy_read_timeout 720s;
```

---

## 📊 COMPARAÇÃO

| Método | Tempo | Dificuldade | Custo | Recomendado |
|--------|-------|-------------|-------|-------------|
| **Cloudflare** | 5 min | Fácil | Grátis | ⭐⭐⭐⭐⭐ |
| **Nginx + Let's Encrypt** | 60 min | Médio | Grátis | ⭐⭐⭐⭐ |
| **AWS ALB** | 30 min | Médio | ~$20/mês | ⭐⭐⭐ |

---

## 🎯 RECOMENDAÇÃO FINAL

### **Use Cloudflare!** ⭐

**Por quê?**
1. ✅ Setup em 5 minutos
2. ✅ Não precisa SSH no servidor
3. ✅ SSL automático
4. ✅ CDN global (mais rápido)
5. ✅ Proteção DDoS
6. ✅ Cache inteligente
7. ✅ Grátis para sempre

**Como?**
1. Cloudflare → Add Site → pharmyrus.com
2. Adicionar registro A: api → 3.238.157.167 (proxy ON)
3. Mudar nameservers no seu registrador
4. SSL mode: Full
5. Always Use HTTPS: ON
6. Pronto! 🎉

**Depois:**
```javascript
// dashboard.js
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

---

## 🚀 RESULTADO FINAL

```
Frontend: https://pharmyrus-dashboard-v2.netlify.app (HTTPS)
    ↓
Backend: https://api.pharmyrus.com (HTTPS via Cloudflare)
    ↓
Servidor AWS: http://localhost:8000 (HTTP interno)

✅ Tudo HTTPS
✅ Sem Mixed Content
✅ Sem timeout (12+ min)
✅ CDN global
✅ Seguro e rápido
```

---

**Tempo total: 5-60 minutos dependendo da opção escolhida.**  
**Recomendação: Cloudflare (5 minutos)** 🚀
