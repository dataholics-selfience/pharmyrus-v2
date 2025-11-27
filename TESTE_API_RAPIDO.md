# 🧪 Guia de Teste Rápido - API Pharmyrus v2

## 🎯 Objetivo
Testar rapidamente a integração com a API real antes do deploy completo.

## 📡 Endpoint da API

```
Base URL: http://3.238.157.167:8000/api/v1
Endpoint: /search
Método: GET
Parâmetro: molecule_name (string)
```

## 🚀 Testes Manuais

### 1. Teste via Browser (Console)

Abra o console do navegador (F12) e execute:

```javascript
// Teste 1: Darolutamide (sucesso esperado)
fetch('http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Sucesso!');
    console.log('Total Patentes:', data.executive_summary.total_patents);
    console.log('Total Famílias:', data.executive_summary.total_families);
    console.log('Status FDA:', data.executive_summary.fda_data.fda_approval_status);
    console.log('Dados completos:', data);
  })
  .catch(err => {
    console.error('❌ Erro:', err);
  });
```

### 2. Teste via cURL (Terminal)

```bash
# Teste básico
curl -X GET "http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide" \
  -H "Content-Type: application/json" \
  | jq '.'

# Teste com timeout aumentado (600 segundos = 10 minutos)
curl -X GET "http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide" \
  -H "Content-Type: application/json" \
  --max-time 600 \
  | jq '.executive_summary'
```

### 3. Teste com Postman

1. Criar nova request GET
2. URL: `http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide`
3. Headers: `Content-Type: application/json`
4. Send
5. Aguardar 3-10 minutos
6. Verificar response

## 📊 Respostas Esperadas

### Sucesso (200 OK)

```json
{
  "executive_summary": {
    "molecule_name": "darolutamide",
    "generic_name": "DAROLUTAMIDE",
    "commercial_name": "Darolutamide",
    "total_patents": 159,
    "total_families": 56,
    "jurisdictions": {
      "brazil": 12,
      "usa": 65,
      "europe": 19
    },
    "patent_types": {
      "product": 43,
      "process": 10,
      "formulation": 15,
      "use": 17
    },
    "consistency_score": 1,
    "fda_data": {
      "fda_approval_status": "Approved",
      "fda_applications": [...]
    },
    "clinical_trials_data": {
      "total_trials": 100,
      "trials_by_phase": {...},
      "trial_details": [...]
    }
  },
  "search_result": {
    "molecule": {
      "molecule_name": "darolutamide",
      "iupac_name": "...",
      "molecular_formula": "C19H19ClN6O2",
      "molecular_weight": "398.8",
      "cas_numbers": ["1297538-32-9"],
      "pubchem_cid": 67171867,
      "chembl_id": "CHEMBL4297185",
      "structure_2d_url": "https://...",
      "wo_numbers": [...]
    },
    "total_patents_found": 159,
    "total_families": 56,
    "patents": [
      {
        "publication_number": "US12087405B2",
        "title": "...",
        "abstract": "...",
        "priority_date": "2020-01-30",
        "filing_date": "2022-04-13",
        "publication_date": "2024-09-10",
        "expiry_date": "2042-04-13",
        "jurisdiction": "US",
        "patent_type": "Process",
        "legal_status": "Unknown",
        "source_url": "https://..."
      },
      // ... 158 mais patentes
    ]
  }
}
```

### Erro 404 (Not Found)

```json
{
  "detail": "Molecule not found"
}
```

### Erro 400 (Bad Request)

```json
{
  "detail": "Missing required parameter: molecule_name"
}
```

### Erro 500 (Internal Server Error)

```json
{
  "detail": "Internal server error: ..."
}
```

## ⏱️ Teste de Tempo de Resposta

```javascript
// Medir tempo de resposta
const startTime = Date.now();

fetch('http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide')
  .then(res => res.json())
  .then(data => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`⏱️ Tempo de resposta: ${duration} segundos`);
    console.log(`⏱️ Em minutos: ${Math.floor(duration / 60)}m ${duration % 60}s`);
  });
```

## 🧪 Moléculas para Teste

### Teste 1: Darolutamide (Complexo)
- **Query**: `darolutamide`
- **Esperado**: 159 patentes, 56 famílias
- **Tempo**: ~8-10 minutos
- **FDA**: Approved (NUBEQA)
- **Trials**: ~100

### Teste 2: Paracetamol (Simples)
- **Query**: `paracetamol`
- **Esperado**: Variável
- **Tempo**: ~5-7 minutos
- **FDA**: Approved (múltiplas marcas)
- **Trials**: Muitos

### Teste 3: Axitinib (Médio)
- **Query**: `axitinib`
- **Esperado**: Variável
- **Tempo**: ~6-8 minutos
- **FDA**: Approved (INLYTA)
- **Trials**: Vários

## 🔍 Validação de Campos

Verificar se os seguintes campos existem na resposta:

```javascript
// Executive Summary
✓ executive_summary.molecule_name
✓ executive_summary.total_patents
✓ executive_summary.total_families
✓ executive_summary.jurisdictions.brazil
✓ executive_summary.jurisdictions.usa
✓ executive_summary.jurisdictions.europe
✓ executive_summary.patent_types.product
✓ executive_summary.patent_types.process
✓ executive_summary.patent_types.formulation
✓ executive_summary.patent_types.use
✓ executive_summary.fda_data.fda_approval_status
✓ executive_summary.clinical_trials_data.total_trials

// Molecule Data
✓ search_result.molecule.molecule_name
✓ search_result.molecule.iupac_name
✓ search_result.molecule.molecular_formula
✓ search_result.molecule.molecular_weight
✓ search_result.molecule.cas_numbers
✓ search_result.molecule.pubchem_cid
✓ search_result.molecule.structure_2d_url

// Patents Array
✓ search_result.patents (array)
✓ search_result.patents[0].publication_number
✓ search_result.patents[0].title
✓ search_result.patents[0].priority_date
✓ search_result.patents[0].expiry_date
✓ search_result.patents[0].jurisdiction
✓ search_result.patents[0].patent_type
✓ search_result.patents[0].legal_status
```

## 🐛 Troubleshooting

### Problema: Timeout
```
Solução: Aumentar timeout do cliente
- Fetch: sem timeout padrão (OK)
- Axios: { timeout: 600000 } // 10 minutos
- cURL: --max-time 600
```

### Problema: CORS Error
```
Erro: "Access-Control-Allow-Origin"
Solução: Backend precisa configurar CORS headers
Headers necessários:
- Access-Control-Allow-Origin: *
- Access-Control-Allow-Methods: GET, POST, OPTIONS
- Access-Control-Allow-Headers: Content-Type
```

### Problema: Empty Response
```
Causa possível: Molécula não encontrada
Verificar: 
- Nome correto da molécula
- Grafia (inglês)
- Sinônimos aceitos
```

### Problema: 500 Error
```
Causa possível: Erro no backend
Ação:
1. Verificar logs do servidor
2. Testar com molécula conhecida (darolutamide)
3. Contatar time de backend
```

## 📝 Checklist de Teste

### Pré-teste
- [ ] API está online
- [ ] Rede permite acesso ao IP 3.238.157.167
- [ ] Timeout configurado (min 10 minutos)
- [ ] Console do browser aberto (F12)

### Durante o Teste
- [ ] Query enviada com sucesso
- [ ] Loading animation aparece
- [ ] Cronômetro funciona
- [ ] 4 etapas animam
- [ ] Aguardar pacientemente (3-10 min)

### Pós-teste
- [ ] Response status 200
- [ ] JSON válido recebido
- [ ] Todos campos obrigatórios presentes
- [ ] Dados fazem sentido
- [ ] Nenhum erro no console
- [ ] Dados salvos no Firebase

## 🎯 Resultado Esperado

```
✅ Status: 200 OK
✅ Tempo: 3-10 minutos
✅ Size: ~500KB - 2MB
✅ Format: JSON válido
✅ Patents: > 0
✅ Families: > 0
✅ FDA Data: presente
✅ Trials: presente
✅ Molecule: dados completos
```

## 🔄 Teste Integrado no Dashboard

```javascript
// No dashboard.js, a função performSearch() faz:

1. Validar input
2. Mostrar loading
3. Iniciar cronômetro
4. Fetch API
   GET http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide
5. Aguardar resposta (3-10 min)
6. Parse JSON
7. Parar cronômetro
8. Esconder loading
9. Exibir resultados:
   - displayExecutiveSummary()
   - displayMoleculeCard()
   - displayPatentsTable()
10. Salvar no Firebase (searches_v2)
11. Notificar sucesso
```

## 💡 Dicas

1. **Primeira busca**: Sempre mais lenta (cache frio)
2. **Buscas subsequentes**: Podem ser mais rápidas (cache)
3. **Moléculas comuns**: Mais dados = mais tempo
4. **Moléculas raras**: Menos dados = menos tempo
5. **Horário**: Horários de pico podem ser mais lentos

## 🚀 Quick Test Script

```javascript
// Copiar e colar no console do browser para teste rápido

(async function quickTest() {
  console.log('🧪 Iniciando teste rápido da API...');
  const startTime = Date.now();
  
  try {
    console.log('📡 Fazendo request...');
    const response = await fetch(
      'http://3.238.157.167:8000/api/v1/search?molecule_name=darolutamide'
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('📥 Parsing JSON...');
    const data = await response.json();
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log('✅ TESTE PASSOU!');
    console.log(`⏱️ Tempo: ${Math.floor(duration/60)}m ${duration%60}s`);
    console.log(`📊 Patentes: ${data.executive_summary.total_patents}`);
    console.log(`👥 Famílias: ${data.executive_summary.total_families}`);
    console.log(`💊 FDA: ${data.executive_summary.fda_data.fda_approval_status}`);
    console.log(`🧪 Trials: ${data.executive_summary.clinical_trials_data.total_trials}`);
    console.log('📦 Dados completos:', data);
    
  } catch (error) {
    console.error('❌ TESTE FALHOU!');
    console.error('Erro:', error.message);
  }
})();
```

---

**Data**: 24/11/2024  
**Versão API**: v1  
**Status**: ✅ API Funcional e Testada
