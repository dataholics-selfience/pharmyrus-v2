# 🌐 COMO APONTAR api.pharmyrus.com PARA AWS

## 📦 DOWNLOAD

[**pharmyrus-v2-COMPLETO-COM-CLOUDFLARE.zip** (356 KB)](computer:///mnt/user-data/outputs/pharmyrus-v2-COMPLETO-COM-CLOUDFLARE.zip)

---

## 🎯 RESPOSTA DIRETA

Para apontar `api.pharmyrus.com` para sua API na AWS (3.238.157.167:8000), você tem 2 opções:

### **Opção 1: Cloudflare** ⭐ RECOMENDADO (5 minutos)
### **Opção 2: DNS + Nginx no servidor** (60 minutos)

---

## ⚡ OPÇÃO 1: CLOUDFLARE (MAIS FÁCIL)

### **Por que Cloudflare?**
- ✅ Setup em **5 minutos**
- ✅ **Não precisa mexer no servidor AWS**
- ✅ SSL **automático e grátis**
- ✅ CDN global (mais rápido)
- ✅ Proteção DDoS
- ✅ **Grátis para sempre**

### **Como funciona:**
```
Browser (HTTPS) 
    ↓
Cloudflare (SSL termination)
    ↓
AWS (HTTP interno - não precisa mudar nada!)
```

**Seu servidor continua em HTTP. Cloudflare adiciona HTTPS!**

---

## 🚀 PASSO A PASSO CLOUDFLARE

### **1. Criar conta** (1 min)
- https://dash.cloudflare.com/sign-up
- Grátis

### **2. Adicionar domínio** (1 min)
- Add a Site → `pharmyrus.com`
- Plano Free (grátis)

### **3. Configurar DNS** (1 min)
Adicionar/Editar registro:
```
Type: A
Name: api
IPv4: 3.238.157.167
Proxy: ✅ ON (nuvem LARANJA) ← IMPORTANTE!
```

### **4. Mudar nameservers** (1 min + 1-24h espera)
Cloudflare dá 2 nameservers tipo:
```
ada.ns.cloudflare.com
chad.ns.cloudflare.com
```

Ir no seu **registrador de domínio** (GoDaddy, Registro.br, etc):
- Trocar nameservers pelos da Cloudflare
- Aguardar propagação (1-24h, geralmente 1-2h)

### **5. Configurar SSL** (30 seg)
No Cloudflare:
- SSL/TLS → Overview → **Full** (não Full strict)
- Always Use HTTPS: **ON**

### **6. Aguardar ativação** (1-24h)
Cloudflare envia email quando ativo.

### **7. Testar**
```bash
curl https://api.pharmyrus.com/api/v1/health
# Deve funcionar!
```

### **8. Atualizar código** (1 linha)
```javascript
// dashboard.js linha 9
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

**PRONTO! ✅**

---

## 📚 GUIAS INCLUÍDOS NO ZIP

1. **GUIA_CLOUDFLARE_5MIN.md** ⭐ - Passo a passo detalhado Cloudflare
2. **GUIA_DOMINIO_API.md** - Todas as opções (Cloudflare, Nginx, etc)
3. **MUDANCAS_CODIGO_CLOUDFLARE.md** - O que mudar no código
4. **GUIA_CTO_HTTPS_BACKEND.md** - Se preferir Nginx (alternativa)

---

## 🔍 ONDE MUDAR NAMESERVERS

### **Registro.br:**
```
Login → Meus Domínios → pharmyrus.com.br 
→ DNS → Nameservers → Trocar
```

### **GoDaddy:**
```
My Products → Domains → Manage → Additional Settings 
→ Manage DNS → Nameservers → Change → Custom
```

### **Namecheap:**
```
Domain List → Manage → Nameservers 
→ Custom DNS → Adicionar nameservers Cloudflare
```

### **Hostinger:**
```
Domains → Manage → DNS/Nameservers 
→ Change Nameservers
```

---

## ⚠️ CUIDADOS IMPORTANTES

### ✅ Proxy Status DEVE estar ON (laranja):
```
❌ Cinza (DNS only) = Não funciona
✅ Laranja (Proxied) = Funciona!
```

### ✅ SSL Mode DEVE ser "Full":
```
❌ Off = Não funciona
❌ Flexible = Não funciona
✅ Full = Funciona!
❌ Full (strict) = Não funciona (servidor não tem SSL)
```

### ✅ Always Use HTTPS DEVE estar ON

---

## 🎯 RESULTADO FINAL

### **Antes:**
```
Frontend: https://pharmyrus-dashboard-v2.netlify.app
Backend: http://3.238.157.167:8000
Problema: ❌ Mixed Content (bloqueado!)
```

### **Depois com Cloudflare:**
```
Frontend: https://pharmyrus-dashboard-v2.netlify.app
Backend: https://api.pharmyrus.com (via Cloudflare)
    ↓
Servidor AWS: http://localhost:8000 (HTTP interno)

Resultado: ✅ TUDO FUNCIONA!
```

**Vantagens:**
- ✅ HTTPS seguro
- ✅ Sem Mixed Content
- ✅ Domínio profissional
- ✅ CDN global
- ✅ Sem timeout (12+ min)
- ✅ Proteção DDoS
- ✅ Grátis

---

## 💰 CUSTOS

### **Cloudflare:**
```
Setup: Grátis
SSL: Grátis
CDN: Grátis
DDoS: Grátis
Mensal: R$ 0,00
```

### **AWS (seu servidor atual):**
```
Continua igual (não muda nada)
```

**TOTAL: R$ 0,00** 🎉

---

## ⏱️ TEMPO

### **Seu trabalho:**
```
Criar conta: 1 min
Adicionar domínio: 1 min
Configurar DNS: 1 min
Mudar nameservers: 1 min
Configurar SSL: 30 seg
Atualizar código: 1 min
Total: 5 minutos
```

### **Espera:**
```
Propagação nameservers: 1-24h (geralmente 1-2h)
```

### **Depois:**
```
✅ api.pharmyrus.com funcionando com HTTPS
✅ Sistema completo
```

---

## 🔧 ALTERNATIVA: NGINX NO SERVIDOR

Se preferir ter **controle total** e não usar Cloudflare:

1. SSH no servidor AWS
2. Instalar Nginx + Let's Encrypt
3. Configurar proxy reverso
4. Obter certificado SSL
5. Tempo: ~60 minutos

**Ver guia:** `GUIA_CTO_HTTPS_BACKEND.md`

**Vantagens:**
- ✅ Controle total
- ✅ Grátis

**Desvantagens:**
- ⚠️ Mais complexo
- ⚠️ Precisa SSH no servidor
- ⚠️ Sem CDN
- ⚠️ Sem proteção DDoS

---

## 📊 COMPARAÇÃO

| Método | Tempo | Dificuldade | Mexe servidor? | CDN | Custo |
|--------|-------|-------------|----------------|-----|-------|
| **Cloudflare** | 5 min | Fácil | ❌ Não | ✅ Sim | Grátis |
| **Nginx** | 60 min | Médio | ✅ Sim | ❌ Não | Grátis |

---

## 🎯 NOSSA RECOMENDAÇÃO

### **USE CLOUDFLARE!** ⭐⭐⭐⭐⭐

**Motivos:**
1. Mais rápido (5 min vs 60 min)
2. Mais fácil (não precisa SSH)
3. Mais seguro (DDoS protection)
4. Mais rápido para usuários (CDN)
5. Igualmente grátis

**Quando usar Nginx:**
- Você quer controle total
- Você tem conhecimento técnico avançado
- Você não quer depender de terceiros

---

## ✅ CHECKLIST CLOUDFLARE

- [ ] Criar conta Cloudflare
- [ ] Adicionar pharmyrus.com
- [ ] Configurar registro A "api" (proxy ON - laranja)
- [ ] Copiar nameservers Cloudflare
- [ ] Mudar nameservers no registrador
- [ ] Aguardar 1-24h (propagação)
- [ ] Configurar SSL "Full"
- [ ] Always Use HTTPS: ON
- [ ] Testar: `curl https://api.pharmyrus.com`
- [ ] Atualizar dashboard.js (linha 9)
- [ ] Deploy no Netlify
- [ ] Testar busca completa (3-12 min)
- [ ] ✅ FUNCIONANDO!

---

## 📞 SUPORTE

**Problema com Cloudflare?** → `GUIA_CLOUDFLARE_5MIN.md`  
**Quer usar Nginx?** → `GUIA_CTO_HTTPS_BACKEND.md`  
**Mudanças no código?** → `MUDANCAS_CODIGO_CLOUDFLARE.md`  
**Visão geral?** → `GUIA_DOMINIO_API.md`

---

## 🎉 RESUMO EXECUTIVO

**Pergunta:** Como apontar api.pharmyrus.com para AWS?

**Resposta:** Use Cloudflare!

**Passos:**
1. Cloudflare → Add Site → pharmyrus.com
2. Adicionar registro A: api → 3.238.157.167 (proxy ON)
3. Mudar nameservers no registrador
4. Aguardar 1-24h
5. Configurar SSL "Full"
6. Mudar 1 linha no código
7. Deploy
8. ✅ Pronto!

**Tempo:** 5 min seu + 1-24h espera  
**Custo:** R$ 0,00  
**Resultado:** HTTPS seguro + CDN + DDoS protection

---

**BAIXE O ZIP E SIGA O `GUIA_CLOUDFLARE_5MIN.md`!** 🚀

**É literalmente 5 minutos de trabalho!**
