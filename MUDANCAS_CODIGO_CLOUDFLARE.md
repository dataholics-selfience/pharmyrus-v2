# 🔧 Mudanças no Código Após Cloudflare

## 📝 O QUE MUDAR

Após configurar Cloudflare e `api.pharmyrus.com` estar funcionando, você precisa mudar **1 linha** no código.

---

## 📄 Arquivo: `js/dashboard.js`

### **Linha ~9:**

**ANTES:**
```javascript
// API Configuration
// Calling API directly like v1 (n8n) - supports long wait times (up to 12 minutes)
const API_BASE_URL = 'http://3.238.157.167:8000/api/v1';
```

**DEPOIS:**
```javascript
// API Configuration
// Using Cloudflare SSL with custom domain
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

---

## 🚀 Como Aplicar

### **Opção 1: Editar localmente**

1. Abrir `pharmyrus-v2/js/dashboard.js`
2. Ir para linha 9
3. Trocar:
   ```javascript
   const API_BASE_URL = 'http://3.238.157.167:8000/api/v1';
   ```
   Por:
   ```javascript
   const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
   ```
4. Salvar
5. Fazer deploy no Netlify

### **Opção 2: Via editor do GitHub**

Se estiver usando Git:

1. GitHub → Repositório → `js/dashboard.js`
2. Click no ícone de editar (lápis)
3. Trocar linha 9
4. Commit changes
5. Netlify vai fazer deploy automático

---

## ✅ Testar Mudança

Após deploy:

1. Abrir site Netlify
2. Abrir DevTools (F12) → Console
3. Fazer uma busca
4. Verificar logs:
   ```
   ✅ Calling API directly (HTTP): https://api.pharmyrus.com/api/v1/search?molecule_name=...
   ```

5. Deve funcionar sem erros!

---

## 🔍 Verificação Completa

### Console do Browser:
```javascript
// Ver qual URL está sendo usada:
console.log('API Base URL:', API_BASE_URL);
// Deve retornar: https://api.pharmyrus.com/api/v1
```

### Network Tab:
- Abrir DevTools (F12)
- Tab "Network"
- Fazer busca
- Ver request para API
- URL deve ser: `https://api.pharmyrus.com/api/v1/search?...`
- Status: 200 OK (depois de 3-12 min)

---

## ⚠️ Troubleshooting

### Erro: "Failed to fetch"
**Causa:** Cloudflare ainda não propagou ou API não está respondendo

**Soluções:**
1. Testar diretamente: `curl https://api.pharmyrus.com/api/v1/health`
2. Verificar Cloudflare proxy está ON (laranja)
3. Verificar SSL mode está "Full"
4. Aguardar propagação (até 24h)

### Erro: "Mixed Content"
**Causa:** Você não mudou a URL ou mudou errado

**Soluções:**
1. Verificar linha 9 do dashboard.js
2. Deve ser: `https://` (não `http://`)
3. Deve ser: `api.pharmyrus.com` (não IP)
4. Fazer novo deploy

### Erro: "CORS"
**Causa:** Cloudflare não está configurado corretamente

**Soluções:**
1. Cloudflare → DNS
2. Registro "api" deve ter proxy ON (laranja)
3. Se estiver OFF (cinza), mudar para ON

### Timeout 26 segundos
**Causa:** Ainda está usando Netlify Function

**Soluções:**
1. Verificar não está usando `/.netlify/functions/api-search`
2. Deve ser: `https://api.pharmyrus.com/api/v1`
3. Fazer novo deploy

---

## 📊 Comparação

### Antes (HTTP direto):
```javascript
const API_BASE_URL = 'http://3.238.157.167:8000/api/v1';
```
**Problemas:**
- ❌ Mixed Content (se frontend HTTPS)
- ❌ Sem SSL
- ❌ Sem cache
- ❌ Sem proteção DDoS

### Depois (Cloudflare):
```javascript
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```
**Vantagens:**
- ✅ HTTPS seguro
- ✅ Sem Mixed Content
- ✅ CDN global
- ✅ Cache inteligente
- ✅ Proteção DDoS
- ✅ Domínio profissional

---

## 🎯 Checklist de Deploy

- [ ] Cloudflare configurado (nameservers ativos)
- [ ] `api.pharmyrus.com` resolvendo
- [ ] Teste: `curl https://api.pharmyrus.com/api/v1/health` funciona
- [ ] dashboard.js linha 9 alterada
- [ ] Novo deploy no Netlify
- [ ] Site abre sem erros
- [ ] Busca funciona (3-12 min espera)
- [ ] Console sem erro "Mixed Content"
- [ ] Console sem erro "Failed to fetch"
- [ ] Loading animation aparece
- [ ] Resultados renderizam corretamente

---

## 💡 Dica Extra

Se quiser deixar configurável por ambiente:

```javascript
// Detectar ambiente
const isDevelopment = window.location.hostname === 'localhost';

const API_BASE_URL = isDevelopment 
  ? 'http://3.238.157.167:8000/api/v1'  // Local testing
  : 'https://api.pharmyrus.com/api/v1';  // Production
```

Assim:
- Localhost → pode usar HTTP direto
- Netlify → usa HTTPS via Cloudflare

---

## 🚀 Resultado Final

**Fluxo completo:**
```
1. Usuário abre: https://pharmyrus-dashboard-v2.netlify.app
2. Faz busca: "paracetamol"
3. Frontend chama: https://api.pharmyrus.com/api/v1/search?molecule_name=paracetamol
4. Cloudflare recebe (HTTPS)
5. Cloudflare encaminha para AWS (HTTP interno)
6. AWS processa (3-12 min)
7. AWS retorna JSON
8. Cloudflare encaminha (HTTPS)
9. Frontend renderiza resultado
```

**✅ Tudo HTTPS!**  
**✅ Sem Mixed Content!**  
**✅ Sem timeout!**  
**✅ Profissional!**

---

**RESUMO:**
Mudar **1 linha** no código:
```javascript
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

**PRONTO!** 🎉
