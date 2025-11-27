# 🧪 Como Testar com API HTTP (Desenvolvimento)

## 🎯 PROBLEMA

Você configurou a API HTTP (`http://3.238.157.167:8000`) mas o frontend está em HTTPS (Netlify).

**Navegadores bloqueiam:** HTTPS → HTTP (Mixed Content)

**Resultado:** Busca falha antes de 1 minuto, animação para, volta para tela de busca.

---

## 🔍 IDENTIFICANDO O ERRO

### **Console do Browser (F12):**

```
🚫 Mixed Content: The page at 'https://pharmyrus-dashboard-v2.netlify.app/' 
   was loaded over HTTPS, but requested an insecure resource 
   'http://3.238.157.167:8000/api/v1/search'. 
   This request has been blocked; the content must be served over HTTPS.
```

**Ou:**

```
❌ TypeError: Failed to fetch
```

**Isso significa:** Navegador bloqueou a requisição HTTP.

---

## ✅ SOLUÇÕES PARA TESTAR AGORA

### **Opção 1: Testar em Localhost** ⭐ MELHOR

HTTP → HTTP não tem bloqueio!

#### **Passo 1: Baixar código**
```bash
# Baixar o ZIP e extrair
# ou
git clone seu-repositorio
cd pharmyrus-v2
```

#### **Passo 2: Servir localmente**

**Opção A - Python (mais simples):**
```bash
# Python 3
python -m http.server 8080

# Abrir: http://localhost:8080
```

**Opção B - Node.js:**
```bash
# Instalar http-server globalmente
npm install -g http-server

# Servir
http-server -p 8080

# Abrir: http://localhost:8080
```

**Opção C - VS Code Live Server:**
```
1. Instalar extensão "Live Server"
2. Clicar direito em index.html
3. "Open with Live Server"
```

#### **Passo 3: Testar busca**
```
http://localhost:8080
Login
Buscar "paracetamol"
Aguardar 3-12 minutos
✅ Funciona!
```

**Por quê funciona?**
- Frontend: `http://localhost:8080` (HTTP)
- Backend: `http://3.238.157.167:8000` (HTTP)
- HTTP → HTTP = ✅ Sem bloqueio!

---

### **Opção 2: Deploy Frontend em HTTP**

Se você tem um servidor HTTP (sem SSL):

1. Deploy código lá
2. Acesse via HTTP (não HTTPS)
3. Funciona!

**Exemplos:**
- `http://seu-servidor.com` (sem HTTPS)
- `http://192.168.1.100` (IP local)

---

### **Opção 3: Desabilitar Mixed Content (NÃO RECOMENDADO)**

**Chrome:**
```
1. Abrir chrome://flags
2. Buscar "Insecure content"
3. "Allow insecure content on secure sites" → Enable
4. Restart Chrome
```

⚠️ **NÃO RECOMENDADO:**
- Deixa seu navegador inseguro
- Só para desenvolvimento temporário
- Lembre de desabilitar depois!

---

### **Opção 4: Usar Proxy Local**

Criar um proxy HTTPS local que encaminha para API HTTP:

```javascript
// proxy-server.js (Node.js)
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());

app.get('/api/v1/*', async (req, res) => {
  const url = `http://3.238.157.167:8000${req.url}`;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.listen(3000, () => {
  console.log('Proxy running on http://localhost:3000');
});
```

Mudar frontend:
```javascript
const API_BASE_URL = 'http://localhost:3000/api/v1';
```

---

## 🚀 SOLUÇÃO PERMANENTE

### **Configurar HTTPS no Backend**

**3 opções:**

1. **DNS Direto + Nginx + Let's Encrypt** (35 min)  
   Ver: `GUIA_DNS_DIRETO_SSL.md`

2. **Cloudflare** (5 min)  
   Ver: `GUIA_CLOUDFLARE_5MIN.md`

3. **AWS ALB com Certificate Manager** (30 min)  
   Ver: `GUIA_CTO_HTTPS_BACKEND.md`

Depois:
```javascript
const API_BASE_URL = 'https://api.pharmyrus.com/api/v1';
```

**Resultado:**
```
Frontend HTTPS → Backend HTTPS = ✅ Funciona perfeitamente!
```

---

## 📊 COMPARAÇÃO

| Método | Tempo | Para produção? | Recomendado? |
|--------|-------|----------------|--------------|
| **Localhost** | 1 min | ❌ Não | ✅ Sim (dev) |
| **Deploy HTTP** | 5 min | ❌ Não | ⚠️ Teste |
| **Desabilitar Mixed** | 1 min | ❌ Não | ❌ Não |
| **Proxy Local** | 10 min | ❌ Não | ⚠️ Dev |
| **Backend HTTPS** | 35 min | ✅ Sim | ⭐ SIM |

---

## 🧪 SCRIPT DE TESTE RÁPIDO

Criar arquivo `test-api.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test API</title>
</head>
<body>
    <h1>Test Pharmyrus API</h1>
    <button onclick="testAPI()">Test Search</button>
    <div id="result"></div>
    
    <script>
        async function testAPI() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = '⏳ Testing...';
            
            try {
                const response = await fetch('http://3.238.157.167:8000/api/v1/search?molecule_name=paracetamol');
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const data = await response.json();
                resultDiv.innerHTML = `✅ Success! Found ${data.patents?.length || 0} patents`;
                console.log('API Response:', data);
                
            } catch (error) {
                resultDiv.innerHTML = `❌ Error: ${error.message}`;
                console.error('Error:', error);
            }
        }
    </script>
</body>
</html>
```

**Servir via Python:**
```bash
python -m http.server 8080
# Abrir: http://localhost:8080/test-api.html
```

**Clicar "Test Search":**
- Se funcionar: ✅ API OK, problema é Mixed Content
- Se falhar: ❌ API não está acessível

---

## 🔍 DEBUGGING

### **Ver erro exato no Console:**

```javascript
// No console do browser (F12):
fetch('http://3.238.157.167:8000/api/v1/search?molecule_name=test')
  .then(res => res.json())
  .then(data => console.log('✅ Success:', data))
  .catch(err => console.error('❌ Error:', err));
```

**Resultados possíveis:**

1. **Mixed Content Error:**
   ```
   Mixed Content: The page at 'https://...' was loaded over HTTPS,
   but requested an insecure resource 'http://...'. This request has been blocked.
   ```
   **Solução:** Use localhost ou configure HTTPS backend

2. **CORS Error:**
   ```
   Access to fetch at 'http://...' from origin 'https://...' has been blocked by CORS policy
   ```
   **Solução:** Adicionar headers CORS no backend

3. **Network Error:**
   ```
   TypeError: Failed to fetch
   ```
   **Solução:** API não está rodando ou IP incorreto

4. **Success:**
   ```
   ✅ Success: {patents: [...], ...}
   ```
   **Ótimo!** API funciona, só precisa HTTPS

---

## ✅ CHECKLIST DE TESTE

**Antes de configurar HTTPS, teste localmente:**

- [ ] Código baixado localmente
- [ ] Servindo via Python/Node/Live Server
- [ ] Acessando via `http://localhost`
- [ ] Login funciona
- [ ] Busca "paracetamol"
- [ ] Animação aparece
- [ ] Aguarda 3-12 minutos
- [ ] Resultado renderiza
- [ ] ✅ Tudo OK!

**Depois que funcionar localmente:**

- [ ] Configurar HTTPS no backend
- [ ] Mudar `API_BASE_URL` para HTTPS
- [ ] Deploy no Netlify
- [ ] Testar em produção
- [ ] ✅ Sistema completo!

---

## 💡 DICAS

### **Durante desenvolvimento:**
- ✅ Use localhost (HTTP)
- ✅ Console sempre aberto (F12)
- ✅ Ver Network tab para requisições
- ✅ Ver Console tab para erros

### **Para produção:**
- ✅ Configure HTTPS no backend
- ✅ Use domínio próprio (api.pharmyrus.com)
- ✅ Teste tudo antes de liberar para usuários

---

## 🎯 RESUMO

**Problema:**
```
Frontend HTTPS → Backend HTTP = ❌ BLOQUEADO
Animação para antes de 1 minuto
```

**Solução Imediata (teste):**
```
Frontend HTTP (localhost) → Backend HTTP = ✅ FUNCIONA
Animação continua até API responder (3-12 min)
```

**Solução Permanente (produção):**
```
Frontend HTTPS → Backend HTTPS = ✅ FUNCIONA
Animação continua até API responder (3-12 min)
```

---

**TESTE AGORA:**
1. `python -m http.server 8080`
2. `http://localhost:8080`
3. Buscar molécula
4. Aguardar resultado
5. ✅ Funciona!

**DEPOIS:**
- Configure HTTPS (ver guias)
- Deploy produção
- Sistema completo!
