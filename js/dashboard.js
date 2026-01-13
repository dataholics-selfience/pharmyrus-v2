// Dashboard JavaScript - API Real Integration
console.log('Dashboard.js with API integration loaded');

let currentUser = null;
let searchTimer = null;
let searchStartTime = null;
let currentSearchData = null;
let currentResults = null; // For patent details modal

// API Configuration
// ✅ Backend agora com HTTPS!
const API_BASE_URL = 'https://core.pharmyrus.com/api/v1';

// Legacy IP-based endpoint (backup):
// const API_BASE_URL = 'http://3.238.157.167:8000/api/v1';

// ========================================
// 🧪 MODO TESTE - MOCK DATA
// ========================================
// ⚠️  ATENÇÃO: API precisa de CORS habilitado!
// Enquanto CTO não adiciona CORS, use MOCK:
// Mude para: const USE_MOCK = true;
// ========================================
const USE_MOCK = false;  // true = MOCK (3s), false = API Real (10-20min)
// ========================================

// Initialize dashboard
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.displayName || user.email;
        }
        
        // Show admin button if user is admin
        if (user.email === ADMIN_EMAIL) {
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) {
                adminBtn.classList.remove('hidden');
                adminBtn.addEventListener('click', () => {
                    window.location.href = 'admin.html';
                });
            }
        }
        
        await loadUserHistory();
    } else {
        window.location.href = 'index.html';
    }
});

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await auth.signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Download JSON (Debug)
const downloadJsonBtn = document.getElementById('downloadJsonBtn');
if (downloadJsonBtn) {
    downloadJsonBtn.addEventListener('click', () => {
        if (!window.currentSearchData) {
            alert('Nenhum dado carregado ainda. Faça uma busca primeiro.');
            return;
        }
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📥 DOWNLOADING JSON');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const dataStr = JSON.stringify(window.currentSearchData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `pharmyrus-${window.currentSearchData.molecule_name || 'search'}-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('✅ JSON downloaded:', link.download);
        console.log('📊 Total patents:', window.currentSearchData.search_result?.patents?.length || 0);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        showNotification('✅ JSON baixado com sucesso!', 'success');
    });
}

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const tabContent = document.getElementById(`${tabName}Tab`);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Reload P&D tab if data exists
        if (tabName === 'pd' && currentSearchData) {
            displayPdTab(currentSearchData);
        }
    });
});

// Search form
const searchForm = document.getElementById('searchForm');
if (searchForm) {
    searchForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await performSearch();
    });
}

async function performSearch() {
    const moleculeName = document.getElementById('moleculeName')?.value.trim();
    
    if (!moleculeName) {
        showNotification('Por favor, insira o nome da molécula!', 'error');
        return;
    }
    
    // ========================================
    // 🧪 DECISÃO: MOCK ou API REAL
    // ========================================
    if (USE_MOCK) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🧪 MODO MOCK ATIVADO');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  Usando dados MOCK para testar interface');
        console.log('📁 Arquivo: data/darolutamide-mock.json');
        console.log('⏱️ Tempo: ~3 segundos');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        showLoadingAnimation(moleculeName);
        searchStartTime = Date.now();
        updateSearchTimer();
        
        try {
            // Simula delay de 3 segundos
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const response = await fetch('data/darolutamide-mock.json');
            const data = await response.json();
            
            console.log('✅ MOCK carregado com sucesso!');
            
            // Continue com o resto do código...
            stopSearchTimer();
            hideLoadingAnimation();
            
            console.log('🔍 Validando estrutura dos dados...');
            if (!data.search_result || !data.search_result.patents) {
                throw new Error('Estrutura de dados inválida');
            }
            
            console.log('✅ VALIDAÇÃO DOS DADOS: OK');
            console.log('📈 Total de patentes:', data.search_result.patents.length);
            console.log('🧪 Nome da molécula:', data.molecule_name);
            
            currentSearchData = data;
            displayResults(data);
            
            await saveSearchToHistory(data);
            
            const duration = Math.round((Date.now() - searchStartTime) / 1000);
            const totalMinutes = Math.floor(duration / 60);
            const totalSeconds = duration % 60;
            
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('🎉 MOCK CONCLUÍDO!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('⏱️ Tempo total:', `${totalMinutes}m ${totalSeconds}s`);
            console.log('📊 Patentes encontradas:', data.search_result.patents.length);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            showNotification(`✅ MOCK: ${data.search_result.patents.length} patentes carregadas!`, 'success');
            
        } catch (error) {
            console.error('❌ Erro ao carregar MOCK:', error);
            stopSearchTimer();
            hideLoadingAnimation();
            showNotification('❌ Erro ao carregar dados MOCK', 'error');
        }
        
        return; // Para aqui, não chama API
    }
    
    // ========================================
    // 🚀 MODO API - POLLING ASSÍNCRONO
    // ========================================
    // Sistema de polling com task_id
    // API processa em background
    // Frontend verifica status periodicamente
    // ========================================
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 INICIANDO BUSCA NA API (ASYNC)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Molécula pesquisada:', moleculeName);
    console.log('🌐 Modo: Polling Assíncrono');
    console.log('🎯 Endpoint: https://core.pharmyrus.com/api/v1');
    console.log('⏱️ Tempo estimado: 10-30 minutos');
    console.log('🕐 Timestamp início:', new Date().toISOString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Show loading animation
    showLoadingAnimation(moleculeName);
    
    // Start timer
    searchStartTime = Date.now();
    updateSearchTimer();
    
    try {
        // ========================================
        // 📤 ETAPA 1: INICIAR BUSCA ASSÍNCRONA
        // ========================================
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📤 ETAPA 1: INICIANDO BUSCA ASSÍNCRONA');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        const initUrl = `${API_BASE_URL}/search/async?molecule_name=${encodeURIComponent(moleculeName)}`;
        console.log('🔗 URL:', initUrl);
        
        const initResponse = await fetch(initUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        if (!initResponse.ok) {
            const errorText = await initResponse.text().catch(() => 'Sem detalhes');
            throw new Error(`Erro ao iniciar busca: ${initResponse.status} - ${errorText}`);
        }
        
        const initData = await initResponse.json();
        const taskId = initData.task_id;
        
        if (!taskId) {
            throw new Error('API não retornou task_id');
        }
        
        console.log('✅ Busca iniciada com sucesso!');
        console.log('🆔 Task ID:', taskId);
        console.log('📊 Status inicial:', initData.status || 'processing');
        console.log('⏱️ Tempo estimado:', initData.estimated_time || '10-30 minutos');
        console.log('🔗 Status URL:', `${API_BASE_URL}/search/async/${taskId}/status`);
        console.log('🔗 Result URL:', `${API_BASE_URL}/search/async/${taskId}/result`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // ========================================
        // 🔄 ETAPA 2: POLLING - VERIFICAR STATUS
        // ========================================
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🔄 ETAPA 2: INICIANDO POLLING');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏱️ Intervalo: 40 segundos (para não sobrecarregar servidor)');
        console.log('🎯 Verificando status até completar...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        let data = null;
        let pollCount = 0;
        const maxPolls = 75; // 50 minutos máximo (75 * 40s)
        
        while (pollCount < maxPolls) {
            pollCount++;
            
            // Aguarda 40 segundos antes de verificar (exceto primeira vez)
            if (pollCount > 1) {
                await new Promise(resolve => setTimeout(resolve, 40000));
            }
            
            console.log(`🔍 Poll #${pollCount} - Verificando status...`);
            
            const statusResponse = await fetch(`${API_BASE_URL}/search/async/${taskId}/status`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            if (!statusResponse.ok) {
                console.warn(`⚠️ Erro ao verificar status (tentativa ${pollCount}):`, statusResponse.status);
                
                // Se for 404, task não existe mais (pode ter expirado)
                if (statusResponse.status === 404) {
                    throw new Error('Task não encontrada. Pode ter expirado.');
                }
                
                // Continua tentando em outros erros
                continue;
            }
            
            const statusData = await statusResponse.json();
            
            console.log(`📊 Status: ${statusData.status || 'unknown'}`);
            if (statusData.progress !== undefined) {
                console.log(`📈 Progresso: ${statusData.progress}%`);
                
                // Atualiza progresso REAL da API
                const statusMessage = statusData.message || statusData.status_message || `Processando... ${statusData.progress}%`;
                window.updateRealProgress(statusData.progress, statusMessage);
            }
            
            // ========================================
            // ✅ STATUS: COMPLETED
            // ========================================
            if (statusData.status === 'completed') {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('✅ BUSCA COMPLETADA!');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('⏱️ Total de polls:', pollCount);
                console.log('📥 Buscando resultado completo...');
                
                // Busca resultado do endpoint separado
                const resultResponse = await fetch(`${API_BASE_URL}/search/async/${taskId}/result`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (!resultResponse.ok) {
                    const errorText = await resultResponse.text().catch(() => 'Sem detalhes');
                    throw new Error(`Erro ao buscar resultado: ${resultResponse.status} - ${errorText}`);
                }
                
                data = await resultResponse.json();
                console.log('✅ Resultado obtido com sucesso!');
                console.log('📊 Estrutura:', Object.keys(data));
                break;
            }
            
            // ========================================
            // ❌ STATUS: ERROR
            // ========================================
            if (statusData.status === 'error' || statusData.status === 'failed') {
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('❌ ERRO NO PROCESSAMENTO');
                console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.error('Detalhes:', statusData.error || statusData.message || 'Erro desconhecido');
                throw new Error(statusData.error || statusData.message || 'Erro no processamento');
            }
            
            // ========================================
            // 🔄 STATUS: PROCESSING / PENDING
            // ========================================
            if (statusData.status === 'processing' || statusData.status === 'pending') {
                const elapsed = Math.round((Date.now() - searchStartTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                console.log(`⏳ Processando... (${minutes}m ${seconds}s decorridos)`);
                continue;
            }
            
            // Status desconhecido, continua tentando
            console.log('⚠️ Status desconhecido:', statusData.status);
        }
        
        // Timeout máximo atingido
        if (!data) {
            throw new Error('Timeout: Máximo de tentativas atingido (50 minutos)');
        }
        
        console.log('✅ Dados recebidos com sucesso!');
        
        // ========================================
        // 🔧 SEÇÃO MOCK - DADOS LOCAIS (DESATIVADA)
        // ========================================
        // Para voltar ao MOCK, comente a seção API acima
        // e descomente o código abaixo:
        /*
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️ MODO MOCK ATIVADO - API FORA DO AR');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📝 Molécula pesquisada:', moleculeName);
        console.log('📁 Usando dados MOCK: data/darolutamide-mock.json');
        console.log('💡 Para voltar ao modo dinâmico, veja comentários no código');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        console.log('📥 Carregando dados MOCK...');
        
        const response = await fetch('data/darolutamide-mock.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar dados MOCK');
        }
        
        const data = await response.json();
        console.log('✅ Dados MOCK carregados com sucesso!');
        console.log('📊 Dados:', {
            patents: data.search_result?.patents?.length || 0,
            molecule: data.search_result?.molecule?.molecule_name || 'unknown'
        });
        
        // Simula delay da API (3 segundos) para testar loading
        await new Promise(resolve => setTimeout(resolve, 3000));
        */
        // ========================================
        // FIM DA SEÇÃO MOCK
        // ========================================
        
        // Validate essential data (funciona para MOCK e API)
        console.log('🔍 Validando estrutura dos dados...');
        
        if (!data.search_result) {
            throw new Error('Dados sem search_result');
        }
        if (!data.search_result.patents) {
            throw new Error('Dados sem patents');
        }
        if (!data.search_result.molecule) {
            throw new Error('Dados sem molecule');
        }
        
        console.log('✅ VALIDAÇÃO DOS DADOS: OK');
        console.log('📈 Total de patentes:', data.search_result.patents.length);
        console.log('🧪 Nome da molécula:', data.search_result.molecule.molecule_name);
        console.log('🏭 Nome comercial:', data.search_result.molecule.commercial_name || 'N/A');
        
        // Stop timer
        stopSearchTimer();
        
        // Store data
        currentSearchData = data;
        
        // Hide loading
        hideLoadingAnimation();
        
        // Display results
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎨 RENDERIZANDO RESULTADOS NA INTERFACE');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        displayResults(data);
        
        // Save to history
        await saveSearchToHistory(moleculeName, data);
        
        // Show success
        const duration = Math.round((Date.now() - searchStartTime) / 1000);
        const totalMinutes = Math.floor(duration / 60);
        const totalSeconds = duration % 60;
        
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 BUSCA CONCLUÍDA COM SUCESSO!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏱️ Tempo total:', `${totalMinutes}m ${totalSeconds}s`);
        console.log('📊 Patentes encontradas:', data.search_result.patents.length);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        showNotification(`✅ Busca concluída! ${data.search_result.patents.length} patentes encontradas.`, 'success');
        
    } catch (error) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ ERRO NA BUSCA');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Tipo de erro:', error.name);
        console.error('Mensagem:', error.message);
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Stop timer and animation
        stopSearchTimer();
        hideLoadingAnimation();
        
        let errorMessage = '❌ Erro ao carregar dados';
        let errorDetails = error.message;
        
        // Detecta erro de CORS
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.name === 'TypeError') {
            console.error('');
            console.error('⚠️  POSSÍVEL ERRO DE CORS!');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.error('A API não tem CORS habilitado.');
            console.error('');
            console.error('SOLUÇÃO:');
            console.error('1. CTO adiciona CORS no backend:');
            console.error('   app.add_middleware(CORSMiddleware, allow_origins=["*"])');
            console.error('');
            console.error('2. OU use MOCK para testar (3 segundos):');
            console.error('   Descomente linha ~168 no código');
            console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            errorMessage = '⚠️ Erro de conexão com API';
            errorDetails = 'A API não permite requisições deste domínio (CORS).\n\nSolução: Backend precisa adicionar headers CORS.';
        }
        
        showNotification(`${errorMessage}\n\n${errorDetails}`, 'error');
    }
}

function showLoadingAnimation(moleculeName) {
    const loadingDiv = document.getElementById('loadingAnimation');
    if (!loadingDiv) return;
    
    loadingDiv.innerHTML = `
        <div class="loading-container">
            <div class="loading-logo-pulse">
                <div class="pulse-ring"></div>
                <div class="pulse-ring pulse-delay-1"></div>
                <div class="pulse-ring pulse-delay-2"></div>
                <div class="logo-center">🔬</div>
            </div>
            
            <h2 class="loading-title">Analisando <span class="highlight-molecule">${moleculeName}</span></h2>
            <p class="loading-subtitle">Consultando bases de dados internacionais de patentes</p>
            
            <div class="loading-timer-box">
                <div class="timer-container">
                    <span class="timer-icon">⏱️</span>
                    <span id="searchTimer" class="timer-value">00:00</span>
                </div>
                <p class="timer-subtitle">Aguarde até 12 minutos</p>
            </div>
            
            <div class="loading-progress-container">
                <div class="progress-track">
                    <div class="progress-fill" id="progressFill"></div>
                    <div class="progress-glow"></div>
                </div>
                <div class="progress-percentage" id="progressPercentage">0%</div>
            </div>
            
            <div class="loading-phases" id="loadingPhases">
                <div class="phase-item active" data-phase="1">
                    <div class="phase-number">1</div>
                    <div class="phase-content">
                        <div class="phase-icon">🔍</div>
                        <span class="phase-label">Buscando patentes globais</span>
                        <span class="phase-detail">WIPO, USPTO, EPO, INPI</span>
                    </div>
                </div>
                <div class="phase-item" data-phase="2">
                    <div class="phase-number">2</div>
                    <div class="phase-content">
                        <div class="phase-icon">📊</div>
                        <span class="phase-label">Coletando dados regulatórios</span>
                        <span class="phase-detail">FDA, EMA, ANVISA</span>
                    </div>
                </div>
                <div class="phase-item" data-phase="3">
                    <div class="phase-number">3</div>
                    <div class="phase-content">
                        <div class="phase-icon">🧪</div>
                        <span class="phase-label">Analisando ensaios clínicos</span>
                        <span class="phase-detail">ClinicalTrials.gov, PubMed</span>
                    </div>
                </div>
                <div class="phase-item" data-phase="4">
                    <div class="phase-number">4</div>
                    <div class="phase-content">
                        <div class="phase-icon">🔬</div>
                        <span class="phase-label">Processando estrutura molecular</span>
                        <span class="phase-detail">PubChem, ChEMBL</span>
                    </div>
                </div>
                <div class="phase-item" data-phase="5">
                    <div class="phase-number">5</div>
                    <div class="phase-content">
                        <div class="phase-icon">📈</div>
                        <span class="phase-label">Analisando famílias de patentes</span>
                        <span class="phase-detail">INPADOC, Espacenet</span>
                    </div>
                </div>
                <div class="phase-item" data-phase="6">
                    <div class="phase-number">6</div>
                    <div class="phase-content">
                        <div class="phase-icon">✨</div>
                        <span class="phase-label">Gerando relatório executivo</span>
                        <span class="phase-detail">Compilação final</span>
                    </div>
                </div>
            </div>
            
            <div class="loading-stats" id="loadingStats">
                <div class="stat-item">
                    <span class="stat-number" id="statPatents">0</span>
                    <span class="stat-label">Patentes</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" id="statJurisdictions">0</span>
                    <span class="stat-label">Jurisdições</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" id="statTrials">0</span>
                    <span class="stat-label">Ensaios</span>
                </div>
            </div>
            
            <div class="loading-tips" id="loadingTips">
                <p class="tip-text">💡 <span id="tipText">Processando dados em tempo real...</span></p>
            </div>
        </div>
    `;
    
    loadingDiv.classList.remove('hidden');
    loadingDiv.classList.add('active');
    
    // Start advanced animations
    animateLoadingPhases();
    animateProgress();
    animateStats();
    rotateTips();
}

function animateLoadingPhases() {
    const phases = document.querySelectorAll('.phase-item');
    let currentPhase = 0;
    
    // Interval mais espaçado - muda fase a cada 120 segundos (2 minutos)
    const phaseInterval = setInterval(() => {
        // Remove active from all
        phases.forEach(p => {
            p.classList.remove('active');
            p.classList.add('completed');
        });
        
        // Move to next phase
        currentPhase++;
        if (currentPhase < phases.length) {
            phases[currentPhase].classList.remove('completed');
            phases[currentPhase].classList.add('active');
        } else {
            // Loop back to first phase
            phases.forEach(p => p.classList.remove('completed'));
            currentPhase = 0;
            phases[0].classList.add('active');
        }
    }, 120000); // 2 minutes per phase
    
    window.phaseAnimationInterval = phaseInterval;
}

// ========================================
// 🎯 ATUALIZAR PROGRESSO REAL DA API
// ========================================
window.updateRealProgress = function(progressPercent, statusMessage) {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressFill) {
        progressFill.style.width = `${progressPercent}%`;
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = `${progressPercent}%`;
    }
    
    // Atualiza fases baseado no progresso
    const phases = document.querySelectorAll('.phase-item');
    const currentPhaseIndex = Math.floor((progressPercent / 100) * phases.length);
    
    phases.forEach((phase, index) => {
        phase.classList.remove('active', 'completed');
        if (index < currentPhaseIndex) {
            phase.classList.add('completed');
        } else if (index === currentPhaseIndex) {
            phase.classList.add('active');
        }
    });
    
    // Atualiza mensagem de status se fornecida
    if (statusMessage) {
        const tipText = document.getElementById('tipText');
        if (tipText) {
            tipText.textContent = statusMessage;
        }
    }
    
    console.log(`📊 Progresso atualizado: ${progressPercent}%`, statusMessage || '');
};

function animateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (!progressFill || !progressPercentage) return;
    
    let progress = 0;
    
    // Progresso mais lento e realista - atualiza a cada 10 segundos
    const progressInterval = setInterval(() => {
        const elapsed = (Date.now() - searchStartTime) / 1000; // seconds
        
        // Curva de progresso não-linear (mais rápido no início, mais lento no fim)
        if (elapsed < 60) {
            // Primeiro minuto: 0-30%
            progress = (elapsed / 60) * 30;
        } else if (elapsed < 180) {
            // Minutos 1-3: 30-60%
            progress = 30 + ((elapsed - 60) / 120) * 30;
        } else if (elapsed < 420) {
            // Minutos 3-7: 60-85%
            progress = 60 + ((elapsed - 180) / 240) * 25;
        } else if (elapsed < 720) {
            // Minutos 7-12: 85-98%
            progress = 85 + ((elapsed - 420) / 300) * 13;
        } else {
            // Após 12 min: mantém em 98%
            progress = 98;
        }
        
        progressFill.style.width = `${progress}%`;
        progressPercentage.textContent = `${Math.round(progress)}%`;
        
    }, 10000); // Atualiza a cada 10 segundos
    
    window.progressAnimationInterval = progressInterval;
}

function animateStats() {
    const statPatents = document.getElementById('statPatents');
    const statJurisdictions = document.getElementById('statJurisdictions');
    const statTrials = document.getElementById('statTrials');
    
    if (!statPatents || !statJurisdictions || !statTrials) return;
    
    let patents = 0;
    let jurisdictions = 0;
    let trials = 0;
    
    // Stats incrementam mais devagar - a cada 15 segundos
    const statsInterval = setInterval(() => {
        // Incremento aleatório mas realista
        patents += Math.floor(Math.random() * 8) + 3; // +3 a +10
        jurisdictions = Math.min(Math.floor(patents / 12), 15); // Máx 15
        trials = Math.floor(patents * 0.6); // ~60% do número de patentes
        
        statPatents.textContent = patents;
        statJurisdictions.textContent = jurisdictions;
        statTrials.textContent = trials;
        
    }, 15000); // Atualiza a cada 15 segundos
    
    window.statsAnimationInterval = statsInterval;
}

function rotateTips() {
    const tipText = document.getElementById('tipText');
    if (!tipText) return;
    
    const tips = [
        'Processando dados em tempo real...',
        'Analisando milhares de documentos de patentes...',
        'Cruzando informações de múltiplas bases de dados...',
        'Verificando status legal em diferentes jurisdições...',
        'Coletando dados de aprovações regulatórias...',
        'Identificando famílias de patentes relacionadas...',
        'Consultando bases de dados químicas e moleculares...',
        'Analisando histórico de ensaios clínicos...',
        'Esta busca pode levar até 12 minutos - vale a pena aguardar!',
        'Quanto mais completa a molécula, mais dados encontramos...',
        'Estamos consultando bases internacionais em tempo real...',
        'O relatório final será extremamente detalhado...'
    ];
    
    let currentTip = 0;
    
    // Muda dica a cada 30 segundos
    const tipsInterval = setInterval(() => {
        currentTip = (currentTip + 1) % tips.length;
        tipText.textContent = tips[currentTip];
        
        // Animação de fade
        tipText.style.opacity = '0';
        setTimeout(() => {
            tipText.style.opacity = '1';
        }, 300);
        
    }, 30000); // Muda a cada 30 segundos
    
    window.tipsAnimationInterval = tipsInterval;
}

function updateSearchTimer() {
    searchTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - searchStartTime) / 1000);
        const timerMinutes = Math.floor(elapsed / 60);
        const timerSeconds = elapsed % 60;
        
        const timerEl = document.getElementById('searchTimer');
        if (timerEl) {
            timerEl.textContent = `${String(timerMinutes).padStart(2, '0')}:${String(timerSeconds).padStart(2, '0')}`;
        }
    }, 1000);
}

function stopSearchTimer() {
    if (searchTimer) {
        clearInterval(searchTimer);
        searchTimer = null;
    }
    
    // Clear all animation intervals
    if (window.phaseAnimationInterval) {
        clearInterval(window.phaseAnimationInterval);
        window.phaseAnimationInterval = null;
    }
    
    if (window.progressAnimationInterval) {
        clearInterval(window.progressAnimationInterval);
        window.progressAnimationInterval = null;
    }
    
    if (window.statsAnimationInterval) {
        clearInterval(window.statsAnimationInterval);
        window.statsAnimationInterval = null;
    }
    
    if (window.tipsAnimationInterval) {
        clearInterval(window.tipsAnimationInterval);
        window.tipsAnimationInterval = null;
    }
}

function hideLoadingAnimation() {
    const loadingDiv = document.getElementById('loadingAnimation');
    if (loadingDiv) {
        loadingDiv.classList.remove('active');
        setTimeout(() => {
            loadingDiv.classList.add('hidden');
        }, 300);
    }
}

function displayResults(data) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DISPLAYING RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 Data structure:', Object.keys(data));
    
    // Store current results for patent details modal
    if (data.search_result) {
        currentResults = data.search_result;
        console.log('✅ currentResults stored');
        console.log('📈 Total patents in search_result:', data.search_result.patents?.length || 0);
    }
    
    // Store full data for JSON download
    window.currentSearchData = data;
    
    // Show download JSON button
    const downloadBtn = document.getElementById('downloadJsonBtn');
    if (downloadBtn) {
        downloadBtn.classList.remove('hidden');
    }
    
    // Show results section
    const resultsSection = document.getElementById('resultsSection');
    if (resultsSection) {
        resultsSection.classList.remove('hidden');
    }
    
    // Hide welcome content
    const welcomeContent = document.getElementById('welcomeContent');
    if (welcomeContent) {
        welcomeContent.style.display = 'none';
    }
    
    // Display executive summary
    if (data.executive_summary) {
        console.log('📊 Displaying executive summary...');
        displayExecutiveSummary(data.executive_summary);
    }
    
    // Display patents table
    if (data.search_result && data.search_result.patents) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📋 ANALYZING PATENTS');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📈 Total patents:', data.search_result.patents.length);
        
        // Analyze sources
        const sources = {};
        data.search_result.patents.forEach(patent => {
            let source = 'Outro';
            if (patent.wipo_url || (patent.publication_number && patent.publication_number.startsWith('WO'))) {
                source = 'WIPO';
            } else if (patent.espacenet_url) {
                source = 'EPO';
            } else if (patent.google_patents_url) {
                source = 'Google Patents';
            } else if (patent.jurisdiction === 'BR' || patent.publication_number?.startsWith('BR')) {
                source = 'INPI';
            } else if (patent.jurisdiction === 'US' || patent.publication_number?.startsWith('US')) {
                source = 'USPTO';
            }
            sources[source] = (sources[source] || 0) + 1;
        });
        
        console.log('📊 Patents by source:');
        Object.entries(sources).forEach(([source, count]) => {
            console.log(`  ${source}: ${count}`);
        });
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        displayPatentsTable(data.search_result.patents);
    }
    
    // Display molecule info card
    if (data.search_result && data.search_result.molecule) {
        displayMoleculeCard(data.search_result.molecule);
    }
    
    // Display 3D molecule viewer
    if (data.search_result && data.search_result.molecule) {
        render3DMolecule(data.search_result.molecule);
    }
    
    console.log('✅ Results displayed successfully');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

function displayExecutiveSummary(summary) {
    console.log('Displaying executive summary:', summary);
    
    // Update main metrics cards
    updateElement('totalPatents', summary.total_patents || 0);
    updateElement('totalFamilies', summary.total_families || 0);
    
    // Jurisdictions
    if (summary.jurisdictions) {
        const jurisdictionsEl = document.getElementById('jurisdictionsInfo');
        if (jurisdictionsEl) {
            jurisdictionsEl.innerHTML = `
                <div class="jurisdiction-item">
                    <span class="flag">🇧🇷</span>
                    <span class="count">${summary.jurisdictions.brazil || 0}</span>
                </div>
                <div class="jurisdiction-item">
                    <span class="flag">🇺🇸</span>
                    <span class="count">${summary.jurisdictions.usa || 0}</span>
                </div>
                <div class="jurisdiction-item">
                    <span class="flag">🇪🇺</span>
                    <span class="count">${summary.jurisdictions.europe || 0}</span>
                </div>
            `;
        }
    }
    
    // Patent types chart
    if (summary.patent_types) {
        const typesContainer = document.getElementById('patentTypesChart');
        if (typesContainer) {
            const types = summary.patent_types;
            const total = Object.values(types).reduce((a, b) => a + b, 0);
            
            typesContainer.innerHTML = `
                <div class="chart-bar">
                    <div class="bar-segment" style="width: ${(types.product/total*100)}%; background: #3b82f6;" title="Produto: ${types.product}"></div>
                    <div class="bar-segment" style="width: ${(types.process/total*100)}%; background: #10b981;" title="Processo: ${types.process}"></div>
                    <div class="bar-segment" style="width: ${(types.formulation/total*100)}%; background: #f59e0b;" title="Formulação: ${types.formulation}"></div>
                    <div class="bar-segment" style="width: ${(types.use/total*100)}%; background: #8b5cf6;" title="Uso: ${types.use}"></div>
                </div>
                <div class="chart-legend">
                    <div class="legend-item"><span class="legend-color" style="background: #3b82f6;"></span> Produto (${types.product})</div>
                    <div class="legend-item"><span class="legend-color" style="background: #10b981;"></span> Processo (${types.process})</div>
                    <div class="legend-item"><span class="legend-color" style="background: #f59e0b;"></span> Formulação (${types.formulation})</div>
                    <div class="legend-item"><span class="legend-color" style="background: #8b5cf6;"></span> Uso (${types.use})</div>
                </div>
            `;
        }
    }
    
    // FDA Status
    if (summary.fda_data) {
        const fdaStatusEl = document.getElementById('fdaStatus');
        if (fdaStatusEl) {
            const status = summary.fda_data.fda_approval_status || 'Unknown';
            const statusClass = status.toLowerCase().includes('approved') ? 'approved' : 'pending';
            fdaStatusEl.innerHTML = `<span class="fda-badge fda-${statusClass}">${status}</span>`;
        }
        
        if (summary.fda_data.fda_applications && summary.fda_data.fda_applications.length > 0) {
            const app = summary.fda_data.fda_applications[0];
            const brandNameEl = document.getElementById('brandName');
            if (brandNameEl && app.openfda && app.openfda.brand_name) {
                brandNameEl.textContent = app.openfda.brand_name[0];
            }
        }
    }
    
    // Clinical Trials
    if (summary.clinical_trials_data) {
        const trialsEl = document.getElementById('totalTrials');
        if (trialsEl) {
            trialsEl.textContent = summary.clinical_trials_data.total_trials || 0;
        }
    }
}

function displayMoleculeCard(molecule) {
    const moleculeCard = document.getElementById('moleculeInfoCard');
    if (!moleculeCard) return;
    
    moleculeCard.innerHTML = `
        <h3 class="pd-card-title">
            <i class="fas fa-atom"></i> Informações da Molécula
        </h3>
        <div class="molecule-header">
            <h4>${molecule.generic_name || molecule.molecule_name}</h4>
            ${molecule.commercial_name ? `<span class="molecule-subtitle">${molecule.commercial_name}</span>` : ''}
        </div>
        <div class="molecule-details">
            <div class="detail-row">
                <span class="detail-label">Nome IUPAC:</span>
                <span class="detail-value">${truncateText(molecule.iupac_name || '-', 80)}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Fórmula Molecular:</span>
                <span class="detail-value">${molecule.molecular_formula || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Peso Molecular:</span>
                <span class="detail-value">${molecule.molecular_weight || '-'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">CAS:</span>
                <span class="detail-value">${molecule.cas_numbers ? molecule.cas_numbers[0] : '-'}</span>
            </div>
            ${molecule.structure_2d_url ? `
                <div class="molecule-structure">
                    <h5 style="margin-bottom: 10px;">Estrutura 2D</h5>
                    <img src="${molecule.structure_2d_url}" alt="Estrutura 2D" style="max-width: 100%; border-radius: 8px;" />
                </div>
            ` : ''}
        </div>
    `;
    
    moleculeCard.classList.remove('hidden');
}

function displayPatentsTable(patents, isFiltering = false) {
    const tbody = document.getElementById('patentsTableBody');
    if (!tbody) return;
    
    if (!patents || patents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">Nenhuma patente encontrada</td></tr>';
        updateFilterStats();
        return;
    }
    
    // ========================================
    // 📊 ORDENAR PATENTES POR FONTE
    // ========================================
    // Ordem de prioridade: INPI > WIPO > EPO > USPTO > Outros
    const sourceOrder = {
        'INPI': 1,
        'WIPO': 2,
        'EPO': 3,
        'USPTO': 4,
        'Google Patents': 5,
        'Outro': 6
    };
    
    const getSourcePriority = (patent) => {
        if (patent.publication_number) {
            if (patent.publication_number.startsWith('BR')) return sourceOrder['INPI'];
            if (patent.publication_number.startsWith('WO')) return sourceOrder['WIPO'];
            if (patent.publication_number.startsWith('EP')) return sourceOrder['EPO'];
            if (patent.publication_number.startsWith('US')) return sourceOrder['USPTO'];
        }
        if (patent.jurisdiction === 'BR') return sourceOrder['INPI'];
        if (patent.jurisdiction === 'WO') return sourceOrder['WIPO'];
        if (patent.jurisdiction === 'EP') return sourceOrder['EPO'];
        if (patent.jurisdiction === 'US') return sourceOrder['USPTO'];
        return sourceOrder['Google Patents'];
    };
    
    const sortedPatents = [...patents].sort((a, b) => {
        const priorityA = getSourcePriority(a);
        const priorityB = getSourcePriority(b);
        return priorityA - priorityB;
    });
    
    // Store all patents globally only on first load (not during filtering)
    if (!isFiltering) {
        window.allPatents = sortedPatents || [];
        window.filteredPatents = [...window.allPatents];
    }
    
    tbody.innerHTML = '';
    
    console.log(`📋 Renderizando ${sortedPatents.length} patentes (ordenadas: INPI > WIPO > EPO > USPTO > Outros)...`);
    
    sortedPatents.forEach(patent => {
        const row = document.createElement('tr');
        
        // Detectar fonte da patente baseado nos metadados
        let source = 'Outro';
        
        // Check publication number first (mais confiável)
        if (patent.publication_number) {
            if (patent.publication_number.startsWith('WO')) {
                source = 'WIPO';
            } else if (patent.publication_number.startsWith('BR')) {
                source = 'INPI';
            } else if (patent.publication_number.startsWith('US')) {
                source = 'USPTO';
            } else if (patent.publication_number.startsWith('EP')) {
                source = 'EPO';
            }
        }
        
        // Fallback to URLs if not detected by number
        if (source === 'Outro') {
            if (patent.wipo_url) {
                source = 'WIPO';
            } else if (patent.espacenet_url) {
                source = 'EPO';
            } else if (patent.google_patents_url) {
                source = 'Google Patents';
            } else if (patent.jurisdiction === 'BR') {
                source = 'INPI';
            } else if (patent.jurisdiction === 'US') {
                source = 'USPTO';
            }
        }
        
        // Armazenar fonte no objeto patent
        patent.source = source;
        
        // Cores para cada fonte
        const sourceColors = {
            'WIPO': { bg: '#3b82f6', text: '#ffffff' },
            'EPO': { bg: '#8b5cf6', text: '#ffffff' },
            'USPTO': { bg: '#f59e0b', text: '#ffffff' },
            'Google Patents': { bg: '#ef4444', text: '#ffffff' },
            'INPI': { bg: '#10b981', text: '#ffffff' },
            'Outro': { bg: '#64748b', text: '#ffffff' }
        };
        
        const colors = sourceColors[source] || sourceColors['Outro'];
        
        row.innerHTML = `
            <td>
                <span style="
                    background: ${colors.bg}; 
                    color: ${colors.text}; 
                    padding: 6px 12px; 
                    border-radius: 6px; 
                    font-size: 12px; 
                    font-weight: 600;
                    display: inline-block;
                ">${source}</span>
            </td>
            <td><strong>${patent.publication_number || '-'}</strong></td>
            <td>${truncateText(patent.title || '-', 60)}</td>
            <td>${formatDate(patent.priority_date)}</td>
            <td>${formatDate(patent.expiry_date)}</td>
            <td>${patent.jurisdiction || '-'}</td>
            <td><span class="status-badge status-${getStatusClass(patent.legal_status)}">${patent.legal_status || 'Unknown'}</span></td>
            <td>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <button class="btn btn-primary btn-small" onclick="viewPatentDetails('${patent.publication_number}')" title="Ver detalhes">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    ${patent.source_url || patent.google_patents_url ? `
                        <a href="${patent.source_url || patent.google_patents_url || `https://patents.google.com/patent/${patent.publication_number}/en`}" 
                           target="_blank" 
                           class="btn btn-secondary btn-small" 
                           title="Abrir patente original"
                           style="padding: 8px 12px; text-decoration: none;">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update filter stats
    updateFilterStats();
    
    console.log(`✅ Displayed ${patents.length} patents (todas carregadas)`);
}

function displayPdTab(data) {
    if (!data || !data.executive_summary) return;
    
    const summary = data.executive_summary;
    
    // FDA Information
    if (summary.fda_data) {
        displayFdaInfo(summary.fda_data);
    }
    
    // Clinical Trials
    if (summary.clinical_trials_data) {
        displayClinicalTrials(summary.clinical_trials_data);
    }
}

function displayFdaInfo(fdaData) {
    const fdaContainer = document.getElementById('fdaInfoContainer');
    if (!fdaContainer) return;
    
    let html = '<h3>📊 Informações FDA</h3>';
    
    if (fdaData.fda_applications && fdaData.fda_applications.length > 0) {
        const app = fdaData.fda_applications[0];
        
        html += `
            <div class="fda-application">
                <div class="info-row">
                    <span class="info-label">Status:</span>
                    <span class="info-value fda-badge fda-approved">${fdaData.fda_approval_status}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Número da Aplicação:</span>
                    <span class="info-value">${app.application_number}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Sponsor:</span>
                    <span class="info-value">${app.sponsor_name}</span>
                </div>
                ${app.openfda ? `
                    <div class="info-row">
                        <span class="info-label">Nome Comercial:</span>
                        <span class="info-value">${app.openfda.brand_name ? app.openfda.brand_name[0] : '-'}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Via de Administração:</span>
                        <span class="info-value">${app.openfda.route ? app.openfda.route[0] : '-'}</span>
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    fdaContainer.innerHTML = html;
}

function displayClinicalTrials(trialsData) {
    const trialsContainer = document.getElementById('clinicalTrialsContainer');
    if (!trialsContainer) return;
    
    let html = '<h3>🧪 Ensaios Clínicos</h3>';
    html += `<p class="trials-summary">Total de ensaios: <strong>${trialsData.total_trials}</strong></p>`;
    
    if (trialsData.trial_details && trialsData.trial_details.length > 0) {
        html += '<div class="trials-list">';
        
        trialsData.trial_details.slice(0, 10).forEach(trial => {
            html += `
                <div class="trial-item">
                    <h4>${truncateText(trial.title || 'Sem título', 80)}</h4>
                    <div class="trial-meta">
                        <span class="trial-badge">${trial.phase || 'N/A'}</span>
                        <span class="trial-status">${trial.overall_status || 'Unknown'}</span>
                    </div>
                    <p class="trial-id">NCT ID: ${trial.nct_id}</p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    trialsContainer.innerHTML = html;
}

async function saveSearchToHistory(moleculeName, data) {
    if (!currentUser) return;
    
    try {
        await db.collection('searches_v2').add({
            userId: currentUser.uid,
            moleculeName: moleculeName,
            totalPatents: data.executive_summary?.total_patents || 0,
            totalFamilies: data.executive_summary?.total_families || 0,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            searchParams: { moleculeName },
            resultData: data
        });
        
        console.log('Search saved to history');
        await loadUserHistory();
        
    } catch (error) {
        console.error('Error saving search:', error);
    }
}

async function loadUserHistory() {
    if (!currentUser) return;
    
    try {
        // Busca sem orderBy para evitar índice composto
        const snapshot = await db.collection('searches_v2')
            .where('userId', '==', currentUser.uid)
            .limit(50)  // Busca mais para ordenar depois
            .get();
        
        const historyList = document.getElementById('historyList');
        if (!historyList) return;
        
        historyList.innerHTML = '';
        
        if (snapshot.empty) {
            historyList.innerHTML = '<div class="empty-state"><p>Nenhuma consulta anterior</p></div>';
            return;
        }
        
        // Ordena no JavaScript (não no Firebase)
        const searches = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            searches.push({
                id: doc.id,
                ...data,
                // Converte timestamp para ordenação
                timestampValue: data.timestamp?.toMillis() || 0
            });
        });
        
        // Ordena do mais recente para o mais antigo
        searches.sort((a, b) => b.timestampValue - a.timestampValue);
        
        // Pega apenas os 10 mais recentes
        const recentSearches = searches.slice(0, 10);
        
        recentSearches.forEach((data, index) => {
            const item = document.createElement('div');
            item.className = 'history-item';
            
            const miniViewerId = `mini-viewer-${data.id || index}`;
            
            item.innerHTML = `
                <div class="history-molecule-icon" id="icon-${miniViewerId}">
                    <div id="${miniViewerId}" class="mini-3d-viewer"></div>
                    <i class="fas fa-atom mini-fallback-icon" style="font-size: 32px; color: white; display: none;"></i>
                </div>
                <div class="history-content">
                    <h4>${data.moleculeName}</h4>
                    ${data.commercialName ? `<p class="commercial-name"><i class="fas fa-tag"></i> ${data.commercialName}</p>` : ''}
                    <p class="history-stats">${data.totalPatents} patentes • ${data.totalFamilies} famílias</p>
                    <small>${formatDateTime(data.timestamp?.toDate())}</small>
                </div>
                <button class="btn btn-secondary btn-small" onclick="reloadSearch('${data.id}')">
                    <i class="fas fa-redo"></i> Carregar
                </button>
            `;
            historyList.appendChild(item);
            
            // Try to load 3D molecule (with timeout)
            if (data.resultData?.molecule_info && window.$3Dmol) {
                setTimeout(() => {
                    const miniViewer = document.getElementById(miniViewerId);
                    const fallbackIcon = document.querySelector(`#icon-${miniViewerId} .mini-fallback-icon`);
                    
                    if (!miniViewer) {
                        if (fallbackIcon) fallbackIcon.style.display = 'block';
                        return;
                    }
                    
                    try {
                        const viewer = $3Dmol.createViewer(miniViewer, {
                            backgroundColor: 'rgba(0,0,0,0)',
                            defaultcolors: $3Dmol.rasmolElementColors
                        });
                        
                        // Try to load from SMILES or CAS
                        const moleculeData = data.resultData.molecule_info;
                        let loadAttempted = false;
                        
                        if (moleculeData.smiles) {
                            loadAttempted = true;
                            $3Dmol.download('pdb:' + moleculeData.smiles, viewer, {}, function() {
                                viewer.setStyle({}, {stick: {colorscheme: 'Jmol', radius: 0.15}});
                                viewer.zoomTo();
                                viewer.zoom(0.7);
                                viewer.render();
                                
                                // Slow rotation animation
                                let angle = 0;
                                const rotationInterval = setInterval(() => {
                                    if (!document.getElementById(miniViewerId)) {
                                        clearInterval(rotationInterval);
                                        return;
                                    }
                                    angle += 0.5;
                                    viewer.rotate(0.5, 'y');
                                    viewer.render();
                                }, 50);
                            }, function(error) {
                                // On error, show fallback icon
                                if (fallbackIcon) {
                                    fallbackIcon.style.display = 'block';
                                    miniViewer.style.display = 'none';
                                }
                            });
                        }
                        
                        // Fallback timeout (3 seconds)
                        setTimeout(() => {
                            if (!loadAttempted || !viewer.getModel(0)) {
                                if (fallbackIcon) {
                                    fallbackIcon.style.display = 'block';
                                    miniViewer.style.display = 'none';
                                }
                            }
                        }, 3000);
                        
                    } catch (error) {
                        console.error('Error creating mini 3D viewer:', error);
                        if (fallbackIcon) {
                            fallbackIcon.style.display = 'block';
                            miniViewer.style.display = 'none';
                        }
                    }
                }, index * 200); // Stagger loading
            } else {
                // No 3D data, show fallback immediately
                const fallbackIcon = document.querySelector(`#icon-${miniViewerId} .mini-fallback-icon`);
                if (fallbackIcon) {
                    fallbackIcon.style.display = 'block';
                }
            }
        });
        
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

window.reloadSearch = async function(searchId) {
    try {
        const doc = await db.collection('searches_v2').doc(searchId).get();
        if (doc.exists) {
            const data = doc.data();
            currentSearchData = data.resultData;
            displayResults(data.resultData);
            
            // Switch to results tab
            const consultaTab = document.querySelector('[data-tab="consulta"]');
            if (consultaTab) consultaTab.click();
            
            showNotification('Consulta carregada com sucesso!', 'success');
        }
    } catch (error) {
        console.error('Error reloading search:', error);
        showNotification('Erro ao carregar consulta', 'error');
    }
};

// Helper Functions
function updateElement(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    } catch {
        return dateString;
    }
}

function formatDateTime(date) {
    if (!date) return '-';
    try {
        return date.toLocaleString('pt-BR');
    } catch {
        return '-';
    }
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function getStatusClass(status) {
    if (!status) return 'unknown';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('active') || statusLower.includes('granted')) return 'active';
    if (statusLower.includes('pending')) return 'pending';
    if (statusLower.includes('expired') || statusLower.includes('abandoned')) return 'expired';
    return 'unknown';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

console.log('Dashboard.js with real API integration fully loaded');

// ========================================
// 3D MOLECULE VIEWER
// ========================================

let viewer3D = null;
let rotationInterval = null;
let isRotating = true;

function render3DMolecule(moleculeData) {
    console.log('🔬 Rendering 3D molecule...', moleculeData);
    
    const section = document.getElementById('molecule3DSection');
    const viewerContainer = document.getElementById('molecule3DViewer');
    const formulaEl = document.getElementById('moleculeFormula');
    
    if (!section || !viewerContainer) {
        console.error('❌ 3D viewer containers not found');
        return;
    }
    
    // Show section
    section.classList.remove('hidden');
    
    // Display molecular formula immediately
    if (formulaEl) {
        // Extract molecular formula from synonyms or iupac_name
        let formula = 'Carregando estrutura...';
        
        // Look for formula in synonyms (e.g., "C19H19ClN6O2")
        if (moleculeData.synonyms && Array.isArray(moleculeData.synonyms)) {
            const formulaMatch = moleculeData.synonyms.find(s => /^C\d+H\d+/.test(s));
            if (formulaMatch) {
                formula = formatMolecularFormula(formulaMatch);
            }
        }
        
        formulaEl.innerHTML = `<strong>Fórmula Molecular:</strong> ${formula}`;
    }
    
    // Get SMILES string (if available directly)
    let smiles = moleculeData.smiles || moleculeData.canonical_smiles || moleculeData.isomeric_smiles;
    
    // If no SMILES, try to get it from PubChem
    if (!smiles) {
        console.log('📡 No SMILES in data, fetching from PubChem...');
        
        // Try CAS number first (most reliable)
        if (moleculeData.cas_numbers && moleculeData.cas_numbers.length > 0) {
            const casNumber = moleculeData.cas_numbers[0];
            console.log('🔍 Searching PubChem by CAS:', casNumber);
            fetchSmilesFromPubChem('cas', casNumber);
        }
        // Try molecule name
        else if (moleculeData.molecule_name || moleculeData.inn_name) {
            const molName = moleculeData.inn_name || moleculeData.molecule_name;
            console.log('🔍 Searching PubChem by name:', molName);
            fetchSmilesFromPubChem('name', molName);
        }
        else {
            console.error('❌ No identifiers available to fetch SMILES');
            viewerContainer.classList.add('error');
            return;
        }
        
        return; // Wait for async fetch
    }
    
    // If we have SMILES, render immediately
    console.log('✅ SMILES found:', smiles);
    renderMoleculeFromSMILES(smiles);
}

async function fetchSmilesFromPubChem(identifierType, identifier) {
    const viewerContainer = document.getElementById('molecule3DViewer');
    viewerContainer.classList.add('loading');
    
    try {
        // PubChem PUG REST API to get CID first
        let pugUrl;
        if (identifierType === 'cas') {
            pugUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(identifier)}/cids/JSON`;
        } else {
            pugUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(identifier)}/cids/JSON`;
        }
        
        console.log('📡 Fetching CID from PubChem:', pugUrl);
        
        const response = await fetch(pugUrl);
        if (!response.ok) {
            throw new Error(`PubChem API error: ${response.status}`);
        }
        
        const data = await response.json();
        const cid = data.IdentifierList?.CID?.[0];
        
        if (!cid) {
            throw new Error('No CID found in PubChem response');
        }
        
        console.log('✅ PubChem CID found:', cid);
        
        // Now load the 3D structure using CID
        loadFromPubChem(cid);
        
    } catch (error) {
        console.error('❌ Error fetching from PubChem:', error);
        viewerContainer.classList.remove('loading');
        viewerContainer.classList.add('error');
        
        const formulaEl = document.getElementById('moleculeFormula');
        if (formulaEl) {
            formulaEl.innerHTML += '<br><span style="color: #ef4444;">⚠️ Não foi possível carregar estrutura 3D</span>';
        }
    }
}

function renderMoleculeFromSMILES(smiles) {
    console.log('📐 Rendering molecule from SMILES:', smiles);
    
    const viewerContainer = document.getElementById('molecule3DViewer');
    viewerContainer.classList.add('loading');
    
    // Aguardar DOM estar pronto
    setTimeout(() => {
        try {
            // Initialize 3Dmol viewer
            const config = { backgroundColor: '#0f172a' };
            viewer3D = $3Dmol.createViewer(viewerContainer, config);
            
            // Convert SMILES to 3D using NCI CACTUS
            loadFromSMILES(smiles);
            
            // Setup controls
            setupMoleculeControls();
            
        } catch (error) {
            console.error('❌ Error initializing 3D viewer:', error);
            viewerContainer.classList.remove('loading');
            viewerContainer.classList.add('error');
        }
    }, 100);
}

function formatMolecularFormula(formula) {
    // Convert C19H19ClN6O2 to subscript format
    return formula.replace(/(\d+)/g, '<sub>$1</sub>');
}

async function loadFromSMILES(smiles) {
    const viewerContainer = document.getElementById('molecule3DViewer');
    
    try {
        // Use NCI CACTUS Chemical Identifier Resolver
        const encodedSmiles = encodeURIComponent(smiles);
        const url = `https://cactus.nci.nih.gov/chemical/structure/${encodedSmiles}/sdf`;
        
        console.log('📡 Fetching SDF from CACTUS:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`CACTUS API error: ${response.status}`);
        }
        
        const sdfData = await response.text();
        console.log('✅ SDF data received, length:', sdfData.length);
        
        // Aguardar um pouco e garantir que viewer existe
        await new Promise(resolve => setTimeout(resolve, 50));
        
        if (!viewer3D) {
            const config = { backgroundColor: '#0f172a' };
            viewer3D = $3Dmol.createViewer(viewerContainer, config);
            console.log('✅ Viewer 3D criado');
        }
        
        // Load into viewer
        viewer3D.addModel(sdfData, 'sdf');
        viewer3D.setStyle({}, { stick: { colorscheme: 'Jmol' } });
        viewer3D.setBackgroundColor('#0f172a');
        viewer3D.zoomTo();
        viewer3D.render();
        
        // Setup controls (zoom, rotate, reset, style buttons)
        setupMoleculeControls();
        
        // Add fullscreen listener
        addFullscreenListener();
        
        // Make 3D viewer draggable
        setTimeout(() => makeOriginal3DViewerDraggable(), 200);
        
        // Remove loading state
        viewerContainer.classList.remove('loading');
        
        // Start rotation
        startRotation();
        
        console.log('✅ 3D molecule rendered successfully!');
        
    } catch (error) {
        console.error('❌ Error loading from SMILES:', error);
        
        // Fallback: try to render simple structure
        viewerContainer.classList.remove('loading');
        
        // Show generic molecule representation
        renderFallbackMolecule();
    }
}

async function loadFromPubChem(cid) {
    const viewerContainer = document.getElementById('molecule3DViewer');
    
    try {
        // PubChem REST API for SDF
        const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`;
        
        console.log('📡 Fetching SDF from PubChem:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`PubChem API error: ${response.status}`);
        }
        
        const sdfData = await response.text();
        console.log('✅ PubChem SDF data received');
        
        // Aguardar DOM e criar viewer se ainda não existe
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!viewer3D) {
            const config = { backgroundColor: '#0f172a' };
            viewer3D = $3Dmol.createViewer(viewerContainer, config);
            console.log('✅ Viewer 3D criado');
        }
        
        // Load into viewer
        viewer3D.addModel(sdfData, 'sdf');
        viewer3D.setStyle({}, { stick: { colorscheme: 'Jmol' } });
        viewer3D.setBackgroundColor('#0f172a');
        viewer3D.zoomTo();
        viewer3D.render();
        
        // Setup controls (zoom, rotate, reset, style buttons)
        setupMoleculeControls();
        
        // Add fullscreen listener
        addFullscreenListener();
        
        // Make 3D viewer draggable
        setTimeout(() => makeOriginal3DViewerDraggable(), 200);
        
        // Remove loading state
        viewerContainer.classList.remove('loading');
        
        // Start rotation
        startRotation();
        
        console.log('✅ 3D molecule rendered from PubChem!');
        
    } catch (error) {
        console.error('❌ Error loading from PubChem:', error);
        
        // Fallback to SMILES method
        const moleculeData = currentSearchData?.search_result?.molecule;
        if (moleculeData && moleculeData.smiles) {
            console.log('🔄 Falling back to SMILES conversion...');
            loadFromSMILES(moleculeData.smiles);
        } else {
            viewerContainer.classList.remove('loading');
            renderFallbackMolecule();
        }
    }
}

function renderFallbackMolecule() {
    console.log('⚠️ Rendering fallback generic molecule');
    
    const viewerContainer = document.getElementById('molecule3DViewer');
    viewerContainer.classList.add('error');
    
    // Could add a simple generic molecule structure here
    // For now, just show error state
}

function setupMoleculeControls() {
    // Zoom controls
    let currentZoom = 1.0; // 100%
    
    const zoomIn = document.getElementById('zoomIn');
    const zoomOut = document.getElementById('zoomOut');
    const zoomLevel = document.getElementById('zoomLevel');
    
    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            if (!viewer3D) return;
            currentZoom = Math.min(currentZoom + 0.1, 2.0); // Max 200%
            // 3Dmol zoom works inversely - lower value = zoom in
            viewer3D.zoom(1 / currentZoom);
            viewer3D.render();
            if (zoomLevel) {
                zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
            }
        });
    }
    
    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            if (!viewer3D) return;
            currentZoom = Math.max(currentZoom - 0.1, 0.5); // Min 50%
            // 3Dmol zoom works inversely - higher value = zoom out
            viewer3D.zoom(1 / currentZoom);
            viewer3D.render();
            if (zoomLevel) {
                zoomLevel.textContent = Math.round(currentZoom * 100) + '%';
            }
        });
    }
    
    // Rotate toggle
    const rotateToggle = document.getElementById('rotateToggle');
    if (rotateToggle) {
        rotateToggle.addEventListener('click', () => {
            if (isRotating) {
                stopRotation();
                document.getElementById('rotateText').textContent = 'Iniciar';
                rotateToggle.querySelector('i').classList.remove('fa-sync-alt');
                rotateToggle.querySelector('i').classList.add('fa-play');
            } else {
                startRotation();
                document.getElementById('rotateText').textContent = 'Parar';
                rotateToggle.querySelector('i').classList.remove('fa-play');
                rotateToggle.querySelector('i').classList.add('fa-sync-alt');
            }
        });
    }
    
    // Reset view
    const resetView = document.getElementById('resetView');
    if (resetView) {
        resetView.addEventListener('click', () => {
            if (viewer3D) {
                currentZoom = 1.0;
                viewer3D.zoomTo();
                viewer3D.render();
                if (zoomLevel) {
                    zoomLevel.textContent = '100%';
                }
            }
        });
    }
    
    // Style buttons
    const styleButtons = document.querySelectorAll('.style-btn');
    styleButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            styleButtons.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            
            // Change style
            const style = btn.dataset.style;
            changeStyle(style);
        });
    });
}

function startRotation() {
    if (!viewer3D) return;
    
    isRotating = true;
    let angle = 0;
    
    rotationInterval = setInterval(() => {
        angle += 1;
        viewer3D.rotate(angle, 'y');
        viewer3D.render();
    }, 500); // Rotate every 500ms - 80% slower than before
}

function stopRotation() {
    isRotating = false;
    if (rotationInterval) {
        clearInterval(rotationInterval);
        rotationInterval = null;
    }
}

function changeStyle(style) {
    if (!viewer3D) return;
    
    viewer3D.setStyle({}, {}); // Clear existing styles
    
    switch(style) {
        case 'stick':
            viewer3D.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.15 } });
            break;
        case 'sphere':
            viewer3D.setStyle({}, { sphere: { colorscheme: 'Jmol' } });
            break;
        case 'cartoon':
            viewer3D.setStyle({}, { cartoon: { color: 'spectrum' } });
            break;
        default:
            viewer3D.setStyle({}, { stick: { colorscheme: 'Jmol' } });
    }
    
    viewer3D.render();
}

// Fullscreen modal functions
let fullscreenModal = null;
let fullscreenViewer = null;

function openFullscreenMolecule() {
    if (!viewer3D || fullscreenModal) return;
    
    console.log('🔍 Opening fullscreen molecule viewer');
    
    // Create modal
    fullscreenModal = document.createElement('div');
    fullscreenModal.id = 'moleculeFullscreenModal';
    fullscreenModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        display: flex;
        flex-direction: column;
    `;
    
    // Header with expand and close buttons
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: #1e293b;
        border-bottom: 2px solid #334155;
    `;
    header.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <h3 style="color: #60a5fa; margin: 0;">
                <i class="fas fa-cube"></i> Visualização 3D - Modo Tela Cheia
            </h3>
        </div>
        <div style="display: flex; gap: 10px;">
            <button onclick="fullscreenViewer?.zoomTo(); fullscreenViewer?.zoom(1.5); fullscreenViewer?.render();" style="
                background: #3b82f6;
                border: none;
                color: white;
                padding: 0 16px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 16px;
                display: flex;
                align-items: center;
                gap: 8px;
            " title="Ampliar zoom">
                <i class="fas fa-search-plus"></i> Ampliar
            </button>
            <button onclick="closeFullscreenMolecule()" style="
                background: #ef4444;
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            " title="Fechar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Viewer container
    const viewerContainer = document.createElement('div');
    viewerContainer.id = 'fullscreenMoleculeViewer';
    viewerContainer.style.cssText = `
        flex: 1;
        width: 100%;
        position: relative;
        background: #0f172a;
    `;
    
    fullscreenModal.appendChild(header);
    fullscreenModal.appendChild(viewerContainer);
    document.body.appendChild(fullscreenModal);
    
    // Wait for DOM and create viewer
    setTimeout(async () => {
        try {
            console.log('🔍 Creating fullscreen viewer...');
            console.log('📐 Container dimensions:', viewerContainer.offsetWidth, 'x', viewerContainer.offsetHeight);
            
            // Wait a bit more for container to be fully laid out
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Create new viewer instance for fullscreen
            const config = { 
                backgroundColor: '#0f172a', 
                antialias: true,
                cartoonQuality: 10
            };
            fullscreenViewer = $3Dmol.createViewer(viewerContainer, config);
            
            console.log('✅ Fullscreen viewer created');
            
            // Get molecule data and re-fetch
            const moleculeData = currentSearchData?.search_result?.molecule;
            if (moleculeData && moleculeData.cas_numbers && moleculeData.cas_numbers.length > 0) {
                await fetchAndRenderFullscreen(moleculeData.cas_numbers[0]);
            } else {
                console.error('❌ No molecule data for fullscreen');
            }
        } catch (error) {
            console.error('❌ Error creating fullscreen viewer:', error);
        }
    }, 200); // Increased delay
}

async function fetchAndRenderFullscreen(casNumber) {
    try {
        console.log('📡 Fetching molecule for fullscreen:', casNumber);
        
        // Get CID from PubChem
        const cidResponse = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(casNumber)}/cids/JSON`);
        const cidData = await cidResponse.json();
        const cid = cidData.IdentifierList?.CID?.[0];
        
        if (!cid) {
            console.error('❌ No CID found');
            return;
        }
        
        console.log('✅ CID found:', cid);
        
        // Get SDF
        const sdfResponse = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`);
        const sdfData = await sdfResponse.text();
        
        console.log('✅ SDF data received for fullscreen, length:', sdfData.length);
        
        // Verify viewer exists
        if (!fullscreenViewer) {
            console.error('❌ Fullscreen viewer not initialized');
            return;
        }
        
        // Clear and render in fullscreen viewer
        fullscreenViewer.clear();
        fullscreenViewer.addModel(sdfData, 'sdf');
        fullscreenViewer.setStyle({}, { stick: { colorscheme: 'Jmol', radius: 0.2 } });
        fullscreenViewer.setBackgroundColor('#0f172a');
        fullscreenViewer.zoomTo();
        fullscreenViewer.render();
        
        console.log('✅ Fullscreen molecule rendered!');
        
        // Get container
        const container = document.getElementById('fullscreenMoleculeViewer');
        if (container) {
            // Add controls to fullscreen viewer
            addFullscreenControls(container);
        }
        
        // Start rotation in fullscreen
        let fsAngle = 0;
        let fsRotation = setInterval(() => {
            if (!fullscreenModal || !fullscreenViewer) {
                clearInterval(fsRotation);
                return;
            }
            fsAngle += 1;
            fullscreenViewer.rotate(fsAngle, 'y');
            fullscreenViewer.render();
        }, 500); // 80% slower rotation
        
        console.log('✅ Fullscreen rotation started');
    } catch (error) {
        console.error('❌ Error rendering fullscreen molecule:', error);
    }
}

function addFullscreenControls(container) {
    // Add control overlay
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        background: rgba(30, 41, 59, 0.9);
        padding: 15px;
        border-radius: 12px;
        z-index: 100;
    `;
    
    // Style buttons
    const btnStyle = `
        background: #3b82f6;
        border: none;
        color: white;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
    `;
    
    controlsDiv.innerHTML = `
        <button onclick="fullscreenViewer?.setStyle({}, {stick:{colorscheme:'Jmol',radius:0.2}});fullscreenViewer?.render();" style="${btnStyle}">Stick</button>
        <button onclick="fullscreenViewer?.setStyle({}, {sphere:{colorscheme:'Jmol'}});fullscreenViewer?.render();" style="${btnStyle}">Sphere</button>
        <button onclick="fullscreenViewer?.setStyle({}, {cartoon:{color:'spectrum'}});fullscreenViewer?.render();" style="${btnStyle}">Cartoon</button>
        <button onclick="fullscreenViewer?.zoomTo();fullscreenViewer?.render();" style="${btnStyle}">Reset</button>
    `;
    
    container.appendChild(controlsDiv);
    console.log('✅ Fullscreen controls added');
}

function closeFullscreenMolecule() {
    console.log('🔙 Closing fullscreen viewer');
    
    if (fullscreenModal) {
        fullscreenModal.remove();
        fullscreenModal = null;
        fullscreenViewer = null;
    }
}

// Add event listener to main viewer for double-click to expand
function addFullscreenListener() {
    const viewerContainer = document.getElementById('molecule3DViewer');
    if (viewerContainer) {
        // Remove existing expand button if any (now it's in the header)
        const existingBtn = viewerContainer.querySelector('.expand-btn-3d');
        if (existingBtn) existingBtn.remove();
        
        // Keep double-click to open fullscreen
        viewerContainer.addEventListener('dblclick', openFullscreenMolecule);
        viewerContainer.style.cursor = 'pointer';
        
        console.log('✅ Fullscreen listener added (double-click)');
    }
}

// Calculate Patent Cliff (expiry date and years remaining)
function calculatePatentCliff(filingDate) {
    if (!filingDate) {
        return {
            expiryDate: 'N/A',
            yearsRemaining: 'N/A',
            status: 'unknown',
            message: 'Data de depósito não disponível'
        };
    }
    
    try {
        const filing = new Date(filingDate);
        const expiry = new Date(filing);
        expiry.setFullYear(expiry.getFullYear() + 20); // Patents last 20 years
        
        const today = new Date();
        const yearsRemaining = (expiry - today) / (1000 * 60 * 60 * 24 * 365.25);
        
        let status, message;
        if (yearsRemaining < 0) {
            status = 'expired';
            message = `Expirada há ${Math.abs(yearsRemaining).toFixed(1)} anos`;
        } else if (yearsRemaining < 2) {
            status = 'critical';
            message = `⚠️ CRÍTICO: Expira em ${yearsRemaining.toFixed(1)} anos`;
        } else if (yearsRemaining < 5) {
            status = 'warning';
            message = `⚠️ Próximo do vencimento: ${yearsRemaining.toFixed(1)} anos`;
        } else {
            status = 'active';
            message = `Ativa: ${yearsRemaining.toFixed(1)} anos restantes`;
        }
        
        return {
            expiryDate: expiry.toISOString().split('T')[0],
            yearsRemaining: yearsRemaining.toFixed(1),
            status,
            message
        };
    } catch (error) {
        console.error('Error calculating patent cliff:', error);
        return {
            expiryDate: 'N/A',
            yearsRemaining: 'N/A',
            status: 'unknown',
            message: 'Erro ao calcular vencimento'
        };
    }
}

// Patent details modal
window.viewPatentDetails = function(publicationNumber) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 ABRINDO DETALHES DA PATENTE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Número:', publicationNumber);
    console.log('🔍 window.allPatents:', window.allPatents ? `${window.allPatents.length} patentes` : 'undefined');
    console.log('🔍 currentResults:', currentResults ? `${currentResults.patents?.length || 0} patentes` : 'undefined');
    
    // Find patent in stored patents (from window.allPatents first)
    let patent = null;
    
    // Try window.allPatents first (from table)
    if (window.allPatents && window.allPatents.length > 0) {
        console.log('🔎 Procurando em window.allPatents...');
        patent = window.allPatents.find(p => p.publication_number === publicationNumber);
        if (patent) {
            console.log('✅ Encontrada em window.allPatents');
        }
    }
    
    // Fallback to currentResults
    if (!patent && currentResults?.patents) {
        console.log('🔎 Procurando em currentResults.patents...');
        patent = currentResults.patents.find(p => p.publication_number === publicationNumber);
        if (patent) {
            console.log('✅ Encontrada em currentResults.patents');
        }
    }
    
    if (!patent) {
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('❌ PATENTE NÃO ENCONTRADA');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('Número buscado:', publicationNumber);
        console.error('window.allPatents:', window.allPatents);
        console.error('currentResults:', currentResults);
        alert('Patente não encontrada nos resultados atuais');
        return;
    }
    
    console.log('✅ Patent found:', patent);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'patentDetailsModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        overflow-y: auto;
    `;
    
    // Patent cliff calculation
    const cliff = calculatePatentCliff(patent.filing_date);
    
    // Modal content
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: #1e293b;
        border-radius: 16px;
        max-width: 900px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    `;
    
    modalContent.innerHTML = `
        <div style="position: sticky; top: 0; background: #1e293b; padding: 30px; border-bottom: 2px solid #334155; display: flex; justify-content: space-between; align-items: center; z-index: 10;">
            <h2 style="color: #60a5fa; margin: 0; font-size: 24px;">
                <i class="fas fa-file-contract"></i> Detalhes da Patente
            </h2>
            <button onclick="document.getElementById('patentDetailsModal').remove();" style="
                background: #ef4444;
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 20px;
            ">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div style="padding: 30px; color: #e2e8f0;">
            <!-- Main Info -->
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #60a5fa; margin-top: 0;">Informações Principais</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div>
                        <strong style="color: #94a3b8;">Número de Publicação:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${patent.publication_number || '-'}</div>
                    </div>
                    <div>
                        <strong style="color: #94a3b8;">Tipo:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${patent.patent_type || '-'}</div>
                    </div>
                    <div>
                        <strong style="color: #94a3b8;">Status Legal:</strong>
                        <div style="margin-top: 5px;">
                            <span style="
                                background: ${patent.legal_status === 'Active' ? '#10b981' : '#ef4444'};
                                color: white;
                                padding: 4px 12px;
                                border-radius: 6px;
                                font-size: 14px;
                            ">${patent.legal_status || 'Unknown'}</span>
                        </div>
                    </div>
                    <div>
                        <strong style="color: #94a3b8;">Jurisdição:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${patent.jurisdiction || '-'}</div>
                    </div>
                </div>
            </div>
            
            <!-- Title -->
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #60a5fa; margin-top: 0;">Título</h3>
                <p style="margin: 0; line-height: 1.6;">${patent.title || '-'}</p>
            </div>
            
            <!-- Abstract -->
            ${patent.abstract ? `
                <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #60a5fa; margin-top: 0;">Resumo</h3>
                    <p style="margin: 0; line-height: 1.6;">${patent.abstract}</p>
                </div>
            ` : ''}
            
            <!-- Dates -->
            <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                <h3 style="color: #60a5fa; margin-top: 0;">Datas Importantes</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <strong style="color: #94a3b8;">Data de Prioridade:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${formatDate(patent.priority_date)}</div>
                    </div>
                    <div>
                        <strong style="color: #94a3b8;">Data de Depósito:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${formatDate(patent.filing_date)}</div>
                    </div>
                    <div>
                        <strong style="color: #94a3b8;">Data de Publicação:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${formatDate(patent.publication_date)}</div>
                    </div>
                    <div>
                        <strong style="color: #94a3b8;">Data de Expiração:</strong>
                        <div style="color: #e2e8f0; margin-top: 5px;">${formatDate(patent.expiry_date)}</div>
                    </div>
                </div>
            </div>
            
            <!-- Patent Cliff -->
            ${cliff ? `
                <div style="background: ${cliff.hasExpired ? '#7f1d1d' : '#1e3a8a'}; padding: 20px; border-radius: 12px; margin-bottom: 20px; border: 2px solid ${cliff.hasExpired ? '#ef4444' : '#3b82f6'};">
                    <h3 style="color: #60a5fa; margin-top: 0;">
                        <i class="fas fa-chart-line"></i> Patent Cliff
                    </h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div>
                            <strong style="color: #94a3b8;">Data de Expiração:</strong>
                            <div style="color: #e2e8f0; margin-top: 5px; font-size: 18px;">${cliff.expiryDate}</div>
                        </div>
                        <div>
                            <strong style="color: #94a3b8;">Anos Restantes:</strong>
                            <div style="color: ${cliff.hasExpired ? '#ef4444' : '#10b981'}; margin-top: 5px; font-size: 18px; font-weight: bold;">
                                ${cliff.hasExpired ? 'EXPIRADA' : cliff.yearsRemaining + ' anos'}
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <!-- Applicants -->
            ${patent.applicants && patent.applicants.length > 0 ? `
                <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #60a5fa; margin-top: 0;">Depositantes</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${patent.applicants.map(app => `<li style="margin-bottom: 5px;">${app}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- Inventors -->
            ${patent.inventors && patent.inventors.length > 0 ? `
                <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #60a5fa; margin-top: 0;">Inventores</h3>
                    <ul style="margin: 0; padding-left: 20px;">
                        ${patent.inventors.map(inv => `<li style="margin-bottom: 5px;">${inv}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            <!-- Classifications -->
            ${patent.classifications && patent.classifications.length > 0 ? `
                <div style="background: #0f172a; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <h3 style="color: #60a5fa; margin-top: 0;">Classificações</h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${patent.classifications.map(cls => `
                            <span style="background: #334155; padding: 6px 12px; border-radius: 6px; font-size: 14px;">${cls}</span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <!-- Links -->
            <div style="background: #0f172a; padding: 20px; border-radius: 12px;">
                <h3 style="color: #60a5fa; margin-top: 0;"><i class="fas fa-link"></i> Links Externos</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${patent.source_url ? `
                        <a href="${patent.source_url}" target="_blank" style="
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 12px 24px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                            font-weight: 600;
                            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                        ">
                            <i class="fas fa-file-alt"></i> Ver Patente Original
                        </a>
                    ` : ''}
                    ${patent.espacenet_url ? `
                        <a href="${patent.espacenet_url}" target="_blank" style="
                            background: #8b5cf6;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-external-link-alt"></i> Espacenet
                        </a>
                    ` : ''}
                    ${patent.google_patents_url ? `
                        <a href="${patent.google_patents_url}" target="_blank" style="
                            background: #ef4444;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-external-link-alt"></i> Google Patents
                        </a>
                    ` : ''}
                    ${patent.wipo_url ? `
                        <a href="${patent.wipo_url}" target="_blank" style="
                            background: #3b82f6;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-external-link-alt"></i> WIPO
                        </a>
                    ` : ''}
                    ${!patent.source_url && !patent.google_patents_url && patent.publication_number ? `
                        <a href="https://patents.google.com/patent/${patent.publication_number}/en" target="_blank" style="
                            background: #ef4444;
                            color: white;
                            padding: 10px 20px;
                            border-radius: 8px;
                            text-decoration: none;
                            display: inline-flex;
                            align-items: center;
                            gap: 8px;
                        ">
                            <i class="fas fa-search"></i> Buscar no Google Patents
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.appendChild(modalContent);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
    
    document.body.appendChild(modal);
    console.log('✅ Patent details modal opened');
};


// ========================================
// 🔍 FUNÇÕES DE FILTRO DE PATENTES
// ========================================

function applyPatentFilters() {
    if (!window.allPatents || window.allPatents.length === 0) {
        console.log('⚠️ No patents to filter');
        return;
    }
    
    console.log('🔍 Applying filters...');
    
    const searchText = document.getElementById('filterSearch')?.value.toLowerCase() || '';
    const source = document.getElementById('filterSource')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const jurisdiction = document.getElementById('filterJurisdiction')?.value.toUpperCase() || '';
    const applicant = document.getElementById('filterApplicant')?.value.toLowerCase() || '';
    const dateStart = document.getElementById('filterDateStart')?.value || '';
    const dateEnd = document.getElementById('filterDateEnd')?.value || '';
    
    window.filteredPatents = window.allPatents.filter(patent => {
        // Text search in title, abstract, number
        if (searchText) {
            const searchIn = (
                (patent.title || '').toLowerCase() + ' ' +
                (patent.abstract || '').toLowerCase() + ' ' +
                (patent.publication_number || '').toLowerCase()
            );
            if (!searchIn.includes(searchText)) return false;
        }
        
        // Source filter
        if (source && patent.source !== source) return false;
        
        // Status filter
        if (status && patent.legal_status !== status) return false;
        
        // Jurisdiction filter
        if (jurisdiction && !(patent.jurisdiction || '').includes(jurisdiction)) return false;
        
        // Applicant filter
        if (applicant) {
            const applicants = (patent.applicants || []).join(' ').toLowerCase();
            if (!applicants.includes(applicant)) return false;
        }
        
        // Date range filter (priority_date)
        if (dateStart || dateEnd) {
            const patentDate = patent.priority_date || patent.filing_date;
            if (patentDate) {
                if (dateStart && patentDate < dateStart) return false;
                if (dateEnd && patentDate > dateEnd) return false;
            }
        }
        
        return true;
    });
    
    console.log(`✅ Filtered: ${window.filteredPatents.length} of ${window.allPatents.length} patents`);
    
    // Re-render table with filtered results
    displayPatentsTable(window.filteredPatents, true); // isFiltering=true
}

function clearPatentFilters() {
    console.log('🧹 Clearing filters...');
    
    // Clear all filter inputs
    document.getElementById('filterSearch').value = '';
    document.getElementById('filterSource').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterJurisdiction').value = '';
    document.getElementById('filterApplicant').value = '';
    document.getElementById('filterDateStart').value = '';
    document.getElementById('filterDateEnd').value = '';
    
    // Reset filtered patents to all patents
    window.filteredPatents = [...window.allPatents];
    
    // Re-render table
    displayPatentsTable(window.allPatents);
    
    console.log('✅ Filters cleared');
}

function updateFilterStats() {
    const statsEl = document.getElementById('filterStats');
    if (!statsEl) return;
    
    const total = window.allPatents?.length || 0;
    const showing = window.filteredPatents?.length || 0;
    
    if (showing < total) {
        statsEl.innerHTML = `<i class="fas fa-filter"></i> Mostrando <strong>${showing}</strong> de <strong>${total}</strong> patentes`;
        statsEl.style.color = '#3b82f6';
    } else {
        statsEl.innerHTML = `<i class="fas fa-check-circle"></i> Mostrando todas as <strong>${total}</strong> patentes`;
        statsEl.style.color = '#10b981';
    }
}

// ========================================
// 🧊 JANELA 3D ARRASTÁVEL
// ========================================

function makeOriginal3DViewerDraggable() {
    const section = document.getElementById('molecule3DSection');
    if (!section || section.classList.contains('hidden')) return;
    
    // Convert to floating modal
    section.style.cssText = `
        position: fixed !important;
        top: 80px;
        right: 30px;
        width: 450px;
        z-index: 1000;
        background: #1e293b;
        border-radius: 12px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        border: 2px solid #334155;
        padding: 0;
    `;
    
    // Create draggable header if not exists
    let header = section.querySelector('.draggable-header-3d');
    if (!header) {
        header = document.createElement('div');
        header.className = 'draggable-header-3d';
        header.style.cssText = `
            background: #0f172a;
            padding: 12px 15px;
            border-radius: 10px 10px 0 0;
            cursor: move;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #334155;
            user-select: none;
        `;
        
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; color: #60a5fa; font-weight: 600;">
                <i class="fas fa-cube"></i>
                <span>Visualização 3D</span>
            </div>
            <div style="display: flex; gap: 8px;">
                <button onclick="openFullscreenMolecule()" style="
                    background: #3b82f6;
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                " title="Tela cheia" onmouseover="this.style.background='#2563eb'" onmouseout="this.style.background='#3b82f6'">
                    <i class="fas fa-expand"></i>
                </button>
                <button onclick="close3DViewer()" style="
                    background: #ef4444;
                    border: none;
                    color: white;
                    width: 28px;
                    height: 28px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.3s;
                " title="Fechar" onmouseover="this.style.background='#dc2626'" onmouseout="this.style.background='#ef4444'">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        section.insertBefore(header, section.firstChild);
    }
    
    // Make draggable
    let isDragging = false;
    let currentX = 0, currentY = 0, initialX = 0, initialY = 0;
    
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('button')) return; // Don't drag if clicking X
        isDragging = true;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            section.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
    
    console.log('✅ Original 3D viewer is now draggable');
}

function close3DViewer() {
    const section = document.getElementById('molecule3DSection');
    if (section) {
        section.classList.add('hidden');
        section.style.position = '';
        section.style.transform = '';
        console.log('🔙 3D viewer closed');
    }
}
