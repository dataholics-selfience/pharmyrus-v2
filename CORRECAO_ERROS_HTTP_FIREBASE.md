# 🔧 GUIA DE CORREÇÃO - Mixed Content & Firebase Permissions

## ❌ PROBLEMAS IDENTIFICADOS

### 1. Mixed Content Error (HTTP vs HTTPS)
```
ERRO: The page at 'https://...' was loaded over HTTPS, 
but requested an insecure resource 'http://3.238.157.167:8000/...'
This request has been blocked
```

**Causa**: Navegadores bloqueiam requisições HTTP de páginas HTTPS por segurança.

### 2. Firebase Permission Error
```
ERRO: FirebaseError: Missing or insufficient permissions
```

**Causa**: Regras do Firestore estão bloqueando acesso à collection `searches_v2`.

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### Solução 1: Netlify Function como Proxy HTTPS

#### O que fizemos?
Criamos uma **Netlify Function** que atua como proxy seguro:
```
Cliente (HTTPS) → Netlify Function (HTTPS) → API Backend (HTTP)
```

#### Arquivos criados:
1. **netlify/functions/api-search.js** - Proxy Function
2. **package.json** - Dependências (node-fetch)
3. **netlify.toml** - Configuração atualizada

#### Como funciona:
```javascript
// Antes (BLOQUEADO):
fetch('http://3.238.157.167:8000/api/v1/search?molecule_name=paracetamol')

// Agora (FUNCIONA):
fetch('/.netlify/functions/api-search?molecule_name=paracetamol')
```

A Netlify Function recebe o request HTTPS e faz a chamada HTTP para o backend.

### Solução 2: Regras Firebase Corretas

#### Arquivo criado:
**firestore.rules** - Regras de segurança atualizadas

#### Regras implementadas:
```javascript
// V2 Searches - acesso apenas ao próprio usuário
match /searches_v2/{searchId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

---

## 🚀 PASSOS PARA APLICAR AS CORREÇÕES

### PASSO 1: Fazer novo deploy no Netlify

1. **Baixar o novo ZIP** (já tem tudo corrigido)
2. **Fazer upload no Netlify**:
   - Arrastar pasta para Netlify
   - Ou fazer git push (se usando Git)

3. **Netlify vai automaticamente**:
   - Instalar node-fetch (via package.json)
   - Criar a Function em `/.netlify/functions/api-search`
   - Configurar timeout adequado

4. **Verificar deploy**:
   - Functions tab deve mostrar `api-search` ativa
   - Status: Published

### PASSO 2: Atualizar regras Firebase

1. **Ir para Firebase Console**:
   ```
   https://console.firebase.google.com/project/patentes-51d85
   ```

2. **Navegar para Firestore Database** → **Rules**

3. **Copiar e colar as novas regras** (arquivo `firestore.rules`):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       match /betaCodes/{codeId} {
         allow read: if request.auth != null;
         allow write: if false;
       }
       
       match /consultations_v1/{consultationId} {
         allow read: if request.auth != null;
         allow create: if request.auth != null;
         allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       
       match /searches_v2/{searchId} {
         allow read: if request.auth != null && resource.data.userId == request.auth.uid;
         allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
         allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       
       match /admin/{document=**} {
         allow read, write: if request.auth != null && request.auth.token.email == 'daniel.mendes@dataholics.io';
       }
       
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

4. **Clicar em "Publish"**

5. **Aguardar propagação** (1-2 minutos)

### PASSO 3: Testar no site

1. **Abrir o site** (https://pharmyrus-dashboard-v2.netlify.app)

2. **Fazer login**

3. **Abrir DevTools** (F12) → Console

4. **Fazer uma busca**: "paracetamol"

5. **Verificar logs**:
   ```
   ✅ Calling API via Netlify Function: /.netlify/functions/api-search?molecule_name=paracetamol
   ✅ API response received
   ✅ Search saved to history
   ```

6. **Verificar histórico carrega** (sem erro de permissions)

---

## 🧪 TESTE RÁPIDO

### Console do Browser:
```javascript
// Testar Netlify Function
fetch('/.netlify/functions/api-search?molecule_name=paracetamol')
  .then(res => res.json())
  .then(data => {
    console.log('✅ FUNCIONOU!');
    console.log('Patentes:', data.executive_summary.total_patents);
  })
  .catch(err => {
    console.error('❌ ERRO:', err);
  });
```

### Resultado esperado:
```
✅ FUNCIONOU!
Patentes: [número]
```

---

## 📝 CHECKLIST DE VALIDAÇÃO

### Mixed Content (HTTP/HTTPS)
- [ ] Deploy no Netlify concluído
- [ ] Function `api-search` ativa
- [ ] package.json com node-fetch instalado
- [ ] netlify.toml configurado corretamente
- [ ] dashboard.js usando `/.netlify/functions/api-search`
- [ ] Sem erro "Mixed Content" no console
- [ ] Busca funciona normalmente

### Firebase Permissions
- [ ] firestore.rules publicadas no Firebase
- [ ] Collection `searches_v2` com regras corretas
- [ ] Usuário autenticado pode criar searches
- [ ] Usuário só vê suas próprias searches
- [ ] Sem erro "Missing permissions" no console
- [ ] Histórico carrega corretamente

### Funcionalidade Completa
- [ ] Login funciona
- [ ] Busca por molécula funciona
- [ ] Loading animation aparece
- [ ] Cronômetro conta
- [ ] Resultados exibidos corretamente
- [ ] Dados salvos no Firebase
- [ ] Histórico mostra buscas anteriores
- [ ] Botão "Carregar" funciona
- [ ] Aba P&D funciona

---

## 🔍 TROUBLESHOOTING

### Se ainda der erro "Failed to fetch":

1. **Verificar Function está ativa**:
   - Netlify Dashboard → Functions
   - Deve aparecer `api-search` com status "Published"

2. **Verificar logs da Function**:
   - Netlify Dashboard → Functions → api-search → Logs
   - Procurar por erros

3. **Testar Function diretamente**:
   ```bash
   curl "https://pharmyrus-dashboard-v2.netlify.app/.netlify/functions/api-search?molecule_name=paracetamol"
   ```

4. **Verificar timeout**:
   - Function timeout default: 10 segundos
   - API demora 3-10 minutos
   - Netlify Functions Pro: timeout de 26 segundos (grátis) ou 15 minutos (pago)

### Se histórico não carrega:

1. **Verificar autenticação**:
   ```javascript
   firebase.auth().onAuthStateChanged(user => {
     console.log('User:', user?.uid);
   });
   ```

2. **Verificar regras no Console**:
   - Firebase Console → Firestore → Rules
   - Deve ter match para `searches_v2`

3. **Testar permissões manualmente**:
   ```javascript
   firebase.firestore()
     .collection('searches_v2')
     .where('userId', '==', firebase.auth().currentUser.uid)
     .get()
     .then(snapshot => {
       console.log('✅ Permissões OK! Docs:', snapshot.size);
     })
     .catch(err => {
       console.error('❌ Erro:', err);
     });
   ```

---

## ⚠️ IMPORTANTE: Timeout da API

### Problema:
A API do backend demora **3-10 minutos** para responder.  
Netlify Functions Free tem timeout de **26 segundos**.

### Soluções:

#### Opção 1: Upgrade Netlify Pro
- Timeout: até 15 minutos
- Custo: ~$19/mês

#### Opção 2: Backend com HTTPS (IDEAL)
- CTO precisa adicionar certificado SSL no backend
- Aí pode chamar direto sem Function
- Sem limite de timeout

#### Opção 3: Background Functions (Futuro)
- Implementar sistema de webhooks
- API notifica quando termina
- Mais complexo mas escalável

### Por enquanto:
A Function vai dar **timeout após 26 segundos**, mas isso é esperado. Precisamos de uma das soluções acima para produção.

---

## 📦 ARQUIVOS NOVOS/MODIFICADOS

### Novos:
```
netlify/functions/api-search.js  (Proxy HTTPS)
package.json                      (Dependencies)
firestore.rules                   (Firebase Rules)
```

### Modificados:
```
js/dashboard.js                   (API_BASE_URL changed)
netlify.toml                      (Functions config added)
```

---

## 🎯 RESULTADO FINAL ESPERADO

```
✅ Página HTTPS sem Mixed Content errors
✅ API chamada via Netlify Function (proxy)
✅ Firebase permissions funcionando
✅ Histórico carregando corretamente
✅ Busca funcionando (até timeout de 26s)
⚠️ Timeout após 26s (esperado - veja soluções acima)
```

---

## 📞 PRÓXIMOS PASSOS

1. **Aplicar correções** (deploy + Firebase rules)
2. **Testar funcionamento básico**
3. **Discutir com CTO**:
   - Adicionar HTTPS no backend (melhor solução)
   - OU contratar Netlify Pro (timeout 15min)
   - OU implementar sistema de webhooks

---

**Data**: 24/11/2024  
**Status**: ✅ Correções Implementadas  
**Próximo Deploy**: Incluir estas correções
