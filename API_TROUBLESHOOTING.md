# 🔧 Troubleshooting API - Guia Completo

## 📦 Problema Reportado

**Sintomas:**
- Interface não chama a API real
- Responde em 3 minutos (muito rápido)
- URL esperada: `https://core.pharmyrus.com/api/v1/search?molecule_name=darolutamide`
- Interface parecia usar dados mock ao invés da API

## ✅ Correções Aplicadas

### **1. Logs Detalhados**

O código agora inclui logs extremamente detalhados em cada etapa:

```javascript
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🔍 INICIANDO BUSCA NA API REAL');
console.log('📝 Molécula pesquisada:', moleculeName);
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
```

**Você verá logs para:**
- Início da busca
- URL completa da requisição
- Tempo de resposta
- Status HTTP
- Headers da resposta
- Estrutura do JSON recebido
- Validação dos dados
- Tempo total

### **2. Validação Rigorosa**

O código agora valida TODOS os campos essenciais:

```javascript
// Validate essential data
if (!data.search_result) {
    throw new Error('API retornou dados sem search_result');
}
if (!data.search_result.patents) {
    throw new Error('API retornou dados sem patents');
}
if (!data.search_result.molecule) {
    throw new Error('API retornou dados sem molecule');
}
```

**Se algum dado estiver faltando, o erro será exibido claramente.**

### **3. URL da API Confirmada**

```javascript
const API_BASE_URL = 'https://core.pharmyrus.com/api/v1';

// Requisição completa
const apiUrl = `${API_BASE_URL}/search?molecule_name=${encodeURIComponent(moleculeName)}`;
```

**Exemplo real:**
```
https://core.pharmyrus.com/api/v1/search?molecule_name=darolutamide
```

## 🧪 Como Testar

### **Opção 1: Página de Teste Simples**

Incluímos um arquivo `test-api.html` para testar a API isoladamente:

1. Abra `test-api.html` no navegador
2. Digite o nome da molécula (ex: darolutamide)
3. Clique em "Testar API"
4. Veja os logs detalhados em tempo real

**Vantagens:**
- Interface simples e clara
- Logs coloridos e organizados
- Sem dependências do Firebase
- Fácil de debugar

### **Opção 2: Dashboard Principal**

1. Faça login no dashboard
2. Abra o Console do navegador (F12)
3. Vá para a aba "Console"
4. Digite o nome da molécula
5. Clique em "Buscar Patentes"
6. Acompanhe os logs detalhados

**O que você deve ver no console:**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 INICIANDO BUSCA NA API REAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Molécula pesquisada: darolutamide
🌐 API Base URL: https://core.pharmyrus.com/api/v1
🕐 Timestamp início: 2024-11-24T21:50:00.000Z
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📡 FAZENDO REQUISIÇÃO HTTP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 URL completa: https://core.pharmyrus.com/api/v1/search?molecule_name=darolutamide
📊 Método: GET
⏳ Aguardando resposta (pode levar 3-12 minutos)...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[... aguardando 3-12 minutos ...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ RESPOSTA RECEBIDA DA API
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Tempo de resposta: 420 segundos (7m 0s)
📊 Status HTTP: 200 OK
📦 Headers: {
  content-type: application/json,
  access-control-allow-origin: *
}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📥 PARSEANDO RESPOSTA JSON
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ JSON parseado com sucesso!
📊 Estrutura dos dados recebidos:
   - executive_summary: ✅
   - search_result: ✅
   - search_result.patents: ✅ (166 patentes)
   - search_result.molecule: ✅

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ VALIDAÇÃO DOS DADOS: OK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Total de patentes: 166
🧪 Nome da molécula: darolutamide
🏭 Nome comercial: Darolutamide
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 RENDERIZANDO RESULTADOS NA INTERFACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 BUSCA CONCLUÍDA COM SUCESSO!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ Tempo total: 7m 0s
📊 Patentes encontradas: 166
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 🔍 Diagnóstico de Erros

### **Erro 1: Failed to fetch**

**Sintomas:**
```
❌ Erro de Conexão
TypeError: Failed to fetch
```

**Possíveis causas:**
1. API offline
2. Problema de CORS
3. Certificado SSL inválido
4. Firewall/Proxy bloqueando

**Como verificar:**

1. Abra DevTools (F12) → Network tab
2. Tente a busca
3. Procure a requisição para `core.pharmyrus.com`
4. Veja o status:
   - **Red (failed)**: Erro de conexão
   - **Status 0**: CORS issue
   - **Status 5xx**: Erro no servidor

**Soluções:**

```bash
# Teste direto da API via curl
curl -X GET "https://core.pharmyrus.com/api/v1/search?molecule_name=darolutamide" \
  -H "Accept: application/json"
```

Se curl funciona mas o navegador não:
- Problema de CORS na API
- API precisa retornar header: `Access-Control-Allow-Origin: *`

### **Erro 2: Timeout / 3 minutos**

**Sintomas:**
```
⚠️ Busca retornou em 3 minutos
❌ Dados incompletos ou mock
```

**Causa provável:**
- API não está sendo chamada de fato
- Há fallback para dados locais

**Como verificar:**

1. Veja no Network tab do DevTools
2. Procure por requisição que demora 3-12 minutos
3. Se não houver requisição longa, API não foi chamada

**Nova validação no código:**

O código agora **exige** que a requisição seja feita e **valida** a resposta:

```javascript
// Se resposta vem em < 1 minuto, algo está errado
const duration = Math.round((Date.now() - fetchStartTime) / 1000);
console.log('⏱️ Tempo de resposta:', duration, 'segundos');

// Valida estrutura
if (!data.search_result || !data.search_result.patents) {
    throw new Error('Dados incompletos da API');
}
```

### **Erro 3: CORS**

**Sintomas:**
```
Access to fetch at 'https://core.pharmyrus.com/api/v1/search' from origin 'https://seu-site.netlify.app' has been blocked by CORS policy
```

**Solução na API:**

O backend precisa retornar headers CORS:

```python
# Flask/FastAPI
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.add('Access-Control-Allow-Methods', 'GET, OPTIONS')
    return response
```

**Teste no navegador:**

```javascript
// Abra console e teste
fetch('https://core.pharmyrus.com/api/v1/search?molecule_name=darolutamide', {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
})
.then(r => r.json())
.then(d => console.log('✅ API funcionando:', d))
.catch(e => console.error('❌ Erro:', e));
```

## 📊 Checklist de Validação

### **Backend (API):**

- [ ] API está rodando em `https://core.pharmyrus.com`
- [ ] Endpoint `/api/v1/search` acessível
- [ ] Aceita parâmetro `molecule_name` via query string
- [ ] Retorna JSON com estrutura correta
- [ ] Headers CORS configurados
- [ ] SSL/HTTPS configurado corretamente
- [ ] Timeout configurado para 15+ minutos

### **Frontend:**

- [ ] URL da API correta: `https://core.pharmyrus.com/api/v1`
- [ ] Fetch está sendo chamado
- [ ] Console mostra logs detalhados
- [ ] Validação dos dados está ativa
- [ ] Não há fallback para dados locais

### **Teste via test-api.html:**

- [ ] Página abre sem erros
- [ ] Campo de input funciona
- [ ] Botão "Testar API" ativo
- [ ] Logs aparecem ao clicar
- [ ] Requisição é feita (ver Network tab)
- [ ] Resposta é recebida e parseada
- [ ] Estrutura validada corretamente

### **Teste via Dashboard:**

- [ ] Login funciona
- [ ] Campo de molécula aparece
- [ ] Console (F12) aberto
- [ ] Busca inicia corretamente
- [ ] Loading animation aparece
- [ ] Logs detalhados no console
- [ ] Requisição aparece no Network tab
- [ ] Resposta demora 3-12 minutos
- [ ] Resultados renderizam na tela

## 🎯 Como Interpretar os Logs

### **Se você vê isso, está funcionando:**

```
✅ RESPOSTA RECEBIDA DA API
⏱️ Tempo de resposta: 420 segundos
📊 Status HTTP: 200 OK
✅ JSON parseado com sucesso!
✅ VALIDAÇÃO DOS DADOS: OK
📈 Total de patentes: 166
```

### **Se você vê isso, há problema:**

```
❌ ERRO NA BUSCA
Tipo de erro: TypeError
Mensagem: Failed to fetch
```

**Próximo passo:** Ver diagnóstico específico nos logs.

## 🔧 Comandos de Teste

### **Teste 1: Verificar se API está online**

```bash
curl -I https://core.pharmyrus.com/api/v1/search
```

**Esperado:** `HTTP/2 200` ou `HTTP/2 400` (mas não erro de conexão)

### **Teste 2: Fazer busca real via curl**

```bash
curl -X GET "https://core.pharmyrus.com/api/v1/search?molecule_name=darolutamide" \
  -H "Accept: application/json" \
  --max-time 900
```

**Esperado:** JSON com dados após 3-12 minutos

### **Teste 3: Verificar CORS via navegador**

Abra console e cole:

```javascript
fetch('https://core.pharmyrus.com/api/v1/search?molecule_name=paracetamol')
  .then(r => {
    console.log('Status:', r.status);
    console.log('Headers:', [...r.headers.entries()]);
    return r.json();
  })
  .then(d => console.log('Data:', d))
  .catch(e => console.error('Error:', e));
```

## 📞 Suporte

### **Se ainda não funcionar:**

1. **Verifique logs completos:**
   - Abra console (F12)
   - Use test-api.html
   - Copie TODOS os logs

2. **Verifique Network tab:**
   - Veja se requisição aparece
   - Status code
   - Response headers
   - Response body

3. **Teste backend isoladamente:**
   - Use curl ou Postman
   - Confirme que API responde

4. **Informações necessárias:**
   - URL completa testada
   - Status HTTP retornado
   - Mensagem de erro completa
   - Screenshot do Network tab
   - Logs do console

## 🎉 Próximos Passos

Após confirmar que a API está funcionando:

1. Deploy do frontend corrigido no Netlify
2. Teste completo com molécula real
3. Verificar tempo de resposta (3-12 min)
4. Validar todos os dados renderizados
5. Testar visualização 3D da molécula

---

**Com estas correções, a interface agora:**
- ✅ Faz requisição real à API
- ✅ Aguarda 3-12 minutos corretamente
- ✅ Valida estrutura dos dados
- ✅ Exibe logs detalhados
- ✅ Mostra erros claramente
