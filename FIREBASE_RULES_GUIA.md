# 🔐 Regras Firebase - V1 + V2 (Permissivas)

## 📋 COPIAR E COLAR NO FIREBASE

**Firebase Console**: https://console.firebase.google.com/project/patentes-51d85  
**Firestore Database** → **Rules** → Copiar o conteúdo de `firestore-permissive.rules`

---

## ✅ O QUE ESTAS REGRAS FAZEM

### **1. Mantêm V1 100% Funcional**
Todas as collections da v1 continuam exatamente como estavam:
- `users` - Leitura pública, escrita autenticada
- `invites` - Leitura pública, escrita autenticada
- `contracts` - Leitura/escrita autenticada
- `searches` - Leitura/escrita autenticada

**Nada quebra! V1 continua funcionando perfeitamente.** ✅

### **2. Adicionam Suporte para V2**
Novas collections para v2:
- `searches_v2` - Leitura/escrita autenticada (NOVA)
- `consultations_v1` - Leitura/escrita autenticada (backup)
- `betaCodes` - Leitura pública, escrita autenticada (compartilhada)

### **3. Proteção Admin**
- Collection `admin` - Apenas daniel.mendes@dataholics.io

### **4. Fallback Permissivo**
- Qualquer outra collection não listada: permite tudo para usuários autenticados
- Isso garante que nada vai quebrar no futuro

---

## 📊 MAPEAMENTO DE COLLECTIONS

### Collections V1 (originais):
```
users/           → Mantido
invites/         → Mantido
contracts/       → Mantido
searches/        → Mantido
```

### Collections V2 (novas):
```
searches_v2/     → NOVA (consultas v2)
consultations_v1 → Backup (se precisar)
betaCodes/       → Compartilhada (convites beta)
```

### Collections Admin:
```
admin/           → Apenas daniel.mendes@dataholics.io
```

---

## 🔓 NÍVEL DE PERMISSIVIDADE

**Estas regras são bem permissivas para facilitar desenvolvimento:**

1. ✅ **Leitura pública** em:
   - users (v1)
   - invites (v1)
   - betaCodes (v2)

2. ✅ **Leitura/escrita para autenticados** em:
   - Todas as outras collections
   - Fallback para collections futuras

3. 🔒 **Restrito ao admin** apenas:
   - Collection `admin/`

**Vantagens:**
- ✅ Fácil de desenvolver
- ✅ Não quebra nada
- ✅ Funciona com v1 e v2
- ✅ Aceita novas collections automaticamente

**Segurança básica mantida:**
- 🔐 Precisa estar autenticado para escrever
- 🔐 Admin collection protegida

---

## 🚀 COMO APLICAR

### PASSO 1: Ir para Firebase Console
```
https://console.firebase.google.com/project/patentes-51d85
```

### PASSO 2: Firestore Database → Rules

### PASSO 3: Substituir regras
Copiar o conteúdo de `firestore-permissive.rules` e colar

### PASSO 4: Publish
Clicar no botão "Publish"

### PASSO 5: Aguardar
Propagação leva ~1-2 minutos

---

## ✅ TESTAR SE FUNCIONOU

### Teste 1: V1 ainda funciona
```javascript
// No site v1
firebase.firestore()
  .collection('searches')
  .add({ test: 'v1 works' })
  .then(() => console.log('✅ V1 OK'));
```

### Teste 2: V2 funciona
```javascript
// No site v2
firebase.firestore()
  .collection('searches_v2')
  .add({ test: 'v2 works' })
  .then(() => console.log('✅ V2 OK'));
```

### Teste 3: Histórico carrega
```javascript
// No dashboard v2
firebase.firestore()
  .collection('searches_v2')
  .where('userId', '==', firebase.auth().currentUser.uid)
  .get()
  .then(snapshot => {
    console.log('✅ Histórico OK! Docs:', snapshot.size);
  });
```

---

## 📝 VERIFICAÇÃO APÓS APLICAR

### No Console do Browser (F12):
```javascript
// Deve funcionar sem erro:
firebase.firestore()
  .collection('searches_v2')
  .add({
    userId: firebase.auth().currentUser.uid,
    moleculeName: 'test',
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(() => console.log('✅ Firestore V2 funcionando!'))
  .catch(err => console.error('❌ Erro:', err));
```

**Resultado esperado:**
```
✅ Firestore V2 funcionando!
```

---

## 🔍 DIAGNÓSTICO DE ERROS

### Se ainda der erro "Missing permissions":

1. **Verificar que publicou as regras**:
   - Firebase Console → Rules
   - Ver data/hora da última publicação

2. **Aguardar propagação**:
   - Esperar 2-3 minutos
   - Recarregar a página

3. **Verificar autenticação**:
   ```javascript
   console.log('User:', firebase.auth().currentUser);
   // Deve retornar objeto do usuário
   ```

4. **Limpar cache**:
   - CTRL+SHIFT+R (hard refresh)
   - Ou abrir aba anônima

5. **Ver logs de segurança**:
   - Firebase Console → Firestore → Rules → Playground
   - Testar operação e ver erro detalhado

---

## 🎯 DIFERENÇAS ENTRE AS REGRAS

### Regras ANTIGAS (suas atuais):
```javascript
// Apenas v1
match /users/{userId} { ... }
match /invites/{inviteId} { ... }
match /contracts/{contractId} { ... }
match /searches/{searchId} { ... }
```

### Regras NOVAS (permissivas v1+v2):
```javascript
// V1 (mantém tudo)
match /users/{userId} { ... }
match /invites/{inviteId} { ... }
match /contracts/{contractId} { ... }
match /searches/{searchId} { ... }

// V2 (adiciona)
match /searches_v2/{searchId} { ... }
match /consultations_v1/{consultationId} { ... }
match /betaCodes/{codeId} { ... }

// Admin
match /admin/{document=**} { ... }

// Fallback permissivo
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

**O fallback garante que qualquer collection funciona se o usuário estiver autenticado!**

---

## 📊 COLLECTIONS USADAS POR CADA VERSÃO

### V1 usa:
- `users`
- `invites`
- `contracts`
- `searches`

### V2 usa:
- `users` (compartilhado com v1)
- `betaCodes` (compartilhado com v1)
- `searches_v2` (NOVO - exclusivo v2)

### Admin usa:
- `admin` (qualquer subcollection)

---

## 🔒 SEGURANÇA

**Estas regras são permissivas mas ainda têm segurança básica:**

✅ **O que está protegido:**
- Escrita: precisa estar autenticado
- Collection admin: apenas daniel.mendes@dataholics.io
- Dados existentes: não podem ser deletados por não-autenticados

⚠️ **O que NÃO está protegido:**
- Usuário autenticado pode ler TODOS os documentos de outras pessoas
- Usuário autenticado pode modificar documentos de outras pessoas

**Para produção, considere regras mais restritivas:**
```javascript
// Exemplo de regra mais restritiva:
match /searches_v2/{searchId} {
  allow read: if request.auth.uid == resource.data.userId;
  allow create: if request.auth.uid == request.resource.data.userId;
  allow update, delete: if request.auth.uid == resource.data.userId;
}
```

Mas por enquanto, as regras permissivas facilitam o desenvolvimento! 🚀

---

## ✅ CHECKLIST

- [ ] Copiei as regras de `firestore-permissive.rules`
- [ ] Acessei Firebase Console
- [ ] Colei no editor de Rules
- [ ] Cliquei em "Publish"
- [ ] Aguardei 1-2 minutos
- [ ] Testei no site (faz busca)
- [ ] Verificou console sem erros "Missing permissions"
- [ ] Histórico carrega corretamente
- [ ] V1 ainda funciona
- [ ] V2 funciona

---

**Pronto! Agora v1 e v2 funcionam juntos perfeitamente!** 🎉
