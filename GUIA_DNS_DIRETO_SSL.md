# 🌐 DNS Direto + SSL no Servidor AWS (Sem Cloudflare)

## 🎯 SOLUÇÃO

Você vai:
1. **Configurar DNS** no GoDaddy (ou onde gerencia pharmyrus.com)
2. **Instalar SSL** no servidor AWS (Nginx + Let's Encrypt)

**Não precisa de Cloudflare!**

---

## 📋 VISÃO GERAL

```
Browser
  ↓
DNS (GoDaddy): api.pharmyrus.com → 3.238.157.167
  ↓
Servidor AWS: Nginx com SSL (443) → FastAPI (8000)
```

**Nginx vai:**
- Receber requisições HTTPS na porta 443
- Fazer proxy para sua API na porta 8000
- Gerenciar certificado SSL automaticamente

---

## 🚀 PASSO A PASSO COMPLETO

### **PARTE 1: CONFIGURAR DNS** (5 minutos)

#### **Opção A: DNS no GoDaddy** (mais comum)

1. **Login no GoDaddy:**
   - https://dcc.godaddy.com/

2. **Ir para Domínios:**
   - My Products → Domains

3. **Selecionar pharmyrus.com:**
   - Click em "DNS" ou "Manage DNS"

4. **Adicionar/Editar Registro A:**
   ```
   Type: A
   Name: api
   Value: 3.238.157.167
   TTL: 600 (10 minutos)
   ```

5. **Salvar**

6. **Aguardar propagação:** 5-30 minutos

7. **Testar:**
   ```bash
   nslookup api.pharmyrus.com
   # Deve retornar: 3.238.157.167
   ```

#### **Opção B: DNS no Registro.br** (se for .com.br)

1. **Login:** https://registro.br/
2. **Meus Domínios** → pharmyrus.com.br
3. **DNS** → **Adicionar Registro**
4. **Configurar:**
   ```
   Tipo: A
   Nome: api
   Conteúdo: 3.238.157.167
   TTL: 600
   ```
5. **Salvar**

#### **Opção C: Qualquer outro provedor**

Todos funcionam igual:
- Entrar no painel DNS
- Adicionar registro A
- Nome: api
- Valor: 3.238.157.167
- TTL: 600 ou 3600

---

### **PARTE 2: INSTALAR SSL NO SERVIDOR AWS** (30-45 minutos)

Agora vamos configurar HTTPS no seu servidor AWS.

#### **Passo 1: Conectar no Servidor**

```bash
# Se usa Windows, use PuTTY ou WSL
# Se usa Mac/Linux, use terminal:

ssh -i sua-chave.pem ubuntu@3.238.157.167

# OU se já tem acesso configurado:
ssh ubuntu@3.238.157.167
```

#### **Passo 2: Atualizar Sistema**

```bash
sudo apt update
sudo apt upgrade -y
```

#### **Passo 3: Instalar Nginx**

```bash
sudo apt install nginx -y
```

Verificar instalação:
```bash
sudo systemctl status nginx
# Deve mostrar "active (running)"
```

#### **Passo 4: Instalar Certbot (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx -y
```

#### **Passo 5: Abrir Portas no Firewall AWS**

**No Console AWS:**

1. **EC2** → **Instâncias**
2. Selecionar sua instância
3. **Security Groups** → Click no security group
4. **Inbound Rules** → **Edit inbound rules**
5. **Add Rule** (fazer isso 2 vezes):

**Regra 1 - HTTP:**
```
Type: HTTP
Protocol: TCP
Port: 80
Source: 0.0.0.0/0
Description: Allow HTTP for Let's Encrypt
```

**Regra 2 - HTTPS:**
```
Type: HTTPS
Protocol: TCP
Port: 443
Source: 0.0.0.0/0
Description: Allow HTTPS
```

6. **Save rules**

#### **Passo 6: Obter Certificado SSL**

⚠️ **IMPORTANTE:** Só faça isso DEPOIS que o DNS estiver propagado!

Testar primeiro:
```bash
nslookup api.pharmyrus.com
# Deve retornar: 3.238.157.167
```

Se retornar o IP correto, continuar:

```bash
sudo certbot --nginx -d api.pharmyrus.com
```

**Responder as perguntas:**
```
Email: seu@email.com
Terms of Service: Y (Yes)
Share email: N (No, ou Y tanto faz)
Redirect HTTP to HTTPS: 2 (Yes, redirect)
```

Certbot vai:
- Obter certificado SSL
- Configurar Nginx automaticamente
- Configurar redirecionamento HTTP → HTTPS

#### **Passo 7: Configurar Nginx como Proxy**

Editar configuração do Nginx:

```bash
sudo nano /etc/nginx/sites-available/pharmyrus-api
```

Colar esta configuração:

```nginx
server {
    listen 80;
    server_name api.pharmyrus.com;
    
    # Certbot vai adicionar redirecionamento aqui
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.pharmyrus.com;

    # Certificados SSL (Certbot preenche automaticamente)
    ssl_certificate /etc/letsencrypt/live/api.pharmyrus.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.pharmyrus.com/privkey.pem;
    
    # Configurações SSL modernas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # Timeouts longos para API (12 minutos)
    proxy_connect_timeout 720s;
    proxy_send_timeout 720s;
    proxy_read_timeout 720s;
    send_timeout 720s;
    
    # Buffer sizes
    client_max_body_size 100M;
    proxy_buffering off;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
    
    # Proxy para sua API FastAPI
    location / {
        # Handle preflight
        if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
        }
        
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
    }
}
```

Salvar: **CTRL+X**, depois **Y**, depois **Enter**

#### **Passo 8: Ativar Configuração**

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/pharmyrus-api /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t
# Deve retornar: "syntax is ok" e "test is successful"

# Recarregar Nginx
sudo systemctl reload nginx
```

#### **Passo 9: Configurar Renovação Automática SSL**

Let's Encrypt certificados duram 90 dias. Configurar renovação automática:

```bash
# Testar renovação
sudo certbot renew --dry-run

# Se funcionar, está configurado!
# Certbot renova automaticamente via systemd timer
```

Verificar timer:
```bash
sudo systemctl status certbot.timer
# Deve mostrar "active (waiting)"
```

#### **Passo 10: Verificar API Rodando**

Sua API FastAPI deve estar rodando na porta 8000:

```bash
# Verificar se está rodando
curl http://localhost:8000/api/v1/health

# OU verificar processos
ps aux | grep uvicorn
# OU
ps aux | grep python
```

Se não estiver rodando, iniciar:

```bash
# Exemplo (ajuste conforme sua configuração):
cd /caminho/da/sua/api
uvicorn main:app --host 0.0.0.0 --port 8000 &
```

**Melhor ainda: usar systemd service** (recomendado)

```bash
sudo nano /etc/systemd/system/pharmyrus-api.service
```

Colar:
```ini
[Unit]
Description=Pharmyrus API
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/pharmyrus-api
Environment="PATH=/home/ubuntu/pharmyrus-api/venv/bin"
ExecStart=/home/ubuntu/pharmyrus-api/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

⚠️ **Ajustar caminhos** conforme sua instalação!

Ativar:
```bash
sudo systemctl daemon-reload
sudo systemctl enable pharmyrus-api
sudo systemctl start pharmyrus-api
sudo systemctl status pharmyrus-api
```

---

### **PARTE 3: TESTAR** (5 minutos)

#### **Teste 1: DNS**
```bash
nslookup api.pharmyrus.com
# Deve retornar: 3.238.157.167
```

#### **Teste 2: SSL**
```bash
curl -I https://api.pharmyrus.com
# Deve retornar: HTTP/2 200 ou similar
```

#### **Teste 3: API Health**
```bash
curl https://api.pharmyrus.com/api/v1/health
# Deve retornar resposta da API
```

#### **Teste 4: API Search** (vai demorar 3-12 min)
```bash
curl https://api.pharmyrus.com/api/v1/search?molecule_name=paracetamol
# Aguardar 3-12 minutos
# Deve retornar JSON com patentes
```

#### **Teste 5: Verificar Certificado**
```bash
openssl s_client -connect api.pharmyrus.com:443 -showcerts
# Deve mostrar certificado Let's Encrypt válido
```

---

### **PARTE 4: ATUALIZAR FRONTEND** (2 minutos)

Editar `js/dashboard.js` linha 9:

**ANTES:**
```javascript
const API_BASE_URL = 'http://3.238.157.167:8000/api/v1';
```

**DEPOIS:**
```javascript
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

Deploy no Netlify.

**PRONTO!** ✅

---

## 🔍 TROUBLESHOOTING

### DNS não propaga
```bash
# Limpar cache local
# Windows:
ipconfig /flushdns

# Mac:
sudo dscacheutil -flushcache

# Linux:
sudo systemd-resolve --flush-caches

# Testar DNS público:
nslookup api.pharmyrus.com 8.8.8.8
```

### Certbot falha ao obter certificado

**Erro:** "Failed to connect" ou "DNS problem"

**Solução:**
1. Verificar DNS propagou: `nslookup api.pharmyrus.com`
2. Verificar porta 80 está aberta no AWS Security Group
3. Verificar Nginx está rodando: `sudo systemctl status nginx`
4. Tentar novamente após 5-10 minutos

**Erro:** "Too many requests"

**Solução:**
- Let's Encrypt tem limite de rate
- Aguardar 1 hora e tentar novamente
- Ou usar staging: `sudo certbot --nginx -d api.pharmyrus.com --staging`

### Nginx não inicia

```bash
# Ver erro:
sudo nginx -t

# Ver logs:
sudo tail -f /var/log/nginx/error.log

# Verificar portas:
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### CORS errors no frontend

**Se aparecer erro CORS no console do browser:**

Editar `/etc/nginx/sites-available/pharmyrus-api` e adicionar headers CORS (já está na configuração acima).

Depois:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### API não responde

```bash
# Verificar API está rodando:
curl http://localhost:8000/api/v1/health

# Ver logs da API:
sudo journalctl -u pharmyrus-api -f

# Reiniciar API:
sudo systemctl restart pharmyrus-api
```

### Timeout após 60 segundos

**Problema:** Nginx timeout padrão é 60s

**Solução:** Já configurado na configuração acima (720s = 12 minutos)

Se ainda der timeout, verificar:
```bash
# Editar configuração principal do Nginx:
sudo nano /etc/nginx/nginx.conf

# Adicionar dentro de http { ... }:
proxy_connect_timeout 720s;
proxy_send_timeout 720s;
proxy_read_timeout 720s;
send_timeout 720s;

# Salvar e recarregar:
sudo nginx -t
sudo systemctl reload nginx
```

### Certificado SSL expira

**Let's Encrypt certificados duram 90 dias.**

**Renovação automática já está configurada!**

Verificar:
```bash
# Ver status do timer:
sudo systemctl status certbot.timer

# Testar renovação manual:
sudo certbot renew --dry-run

# Forçar renovação (se necessário):
sudo certbot renew --force-renewal
```

---

## 📊 RESUMO DA ARQUITETURA

### **Antes (não funcionava):**
```
Browser (HTTPS)
  ↓
❌ BLOCKED (Mixed Content)
  ↓
AWS API (HTTP:8000)
```

### **Depois (funciona!):**
```
Browser (HTTPS)
  ↓
DNS: api.pharmyrus.com → 3.238.157.167
  ↓
AWS Nginx (HTTPS:443)
  ↓
SSL Termination
  ↓
Proxy para localhost:8000
  ↓
FastAPI (HTTP:8000)
```

---

## ✅ CHECKLIST COMPLETO

### DNS:
- [ ] Registro A criado no GoDaddy/DNS
- [ ] api.pharmyrus.com → 3.238.157.167
- [ ] DNS propagado (nslookup funciona)

### AWS Security Group:
- [ ] Porta 80 aberta (0.0.0.0/0)
- [ ] Porta 443 aberta (0.0.0.0/0)
- [ ] Porta 8000 para localhost (não precisa abrir externa)

### Servidor:
- [ ] Nginx instalado
- [ ] Certbot instalado
- [ ] Certificado SSL obtido
- [ ] Configuração Nginx criada
- [ ] Nginx reload funcionou
- [ ] API FastAPI rodando na porta 8000

### Testes:
- [ ] `nslookup api.pharmyrus.com` retorna IP
- [ ] `curl https://api.pharmyrus.com` responde
- [ ] Certificado SSL válido
- [ ] API responde nas rotas

### Frontend:
- [ ] dashboard.js atualizado (API_BASE_URL)
- [ ] Deploy no Netlify
- [ ] Busca funciona (3-12 min)
- [ ] Sem erro Mixed Content

---

## 💰 CUSTOS

```
DNS (GoDaddy): Já pago (parte do domínio)
AWS EC2: Seu custo atual (não muda)
Nginx: Grátis
Let's Encrypt: Grátis
Total adicional: R$ 0,00
```

---

## ⏱️ TEMPO TOTAL

```
DNS: 5 minutos
SSH no servidor: 2 minutos
Instalar Nginx: 5 minutos
Instalar Certbot: 2 minutos
Abrir portas AWS: 3 minutos
Obter certificado: 2 minutos
Configurar Nginx: 10 minutos
Testes: 5 minutos
Atualizar frontend: 2 minutos
-------------------------------
TOTAL: ~35 minutos
```

---

## 🎯 RESULTADO FINAL

```
✅ DNS direto (sem Cloudflare)
✅ HTTPS via Let's Encrypt (grátis)
✅ Nginx como proxy reverso
✅ Timeouts longos (12 minutos)
✅ CORS configurado
✅ Renovação SSL automática
✅ Sistema completo funcionando
```

---

## 📞 COMANDOS ÚTEIS

```bash
# Ver status Nginx
sudo systemctl status nginx

# Ver logs Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Reload Nginx (após mudanças)
sudo nginx -t && sudo systemctl reload nginx

# Ver certificados SSL
sudo certbot certificates

# Testar renovação SSL
sudo certbot renew --dry-run

# Ver API rodando
sudo systemctl status pharmyrus-api
sudo journalctl -u pharmyrus-api -f

# Testar API local
curl http://localhost:8000/api/v1/health

# Testar API externa
curl https://api.pharmyrus.com/api/v1/health
```

---

**PRONTO! Sistema completo sem Cloudflare!** 🚀
