// ============================================
// PHARMYRUS v32.0 - Dashboard Script FINAL
// ============================================

console.log('Pharmyrus v32.0 Dashboard loaded');

// ============================================
// CONFIGURAÇÃO
// ============================================

const API_BASE_URL = 'https://pharmyrus-total31-production-b8b1.up.railway.app';
const ADMIN_EMAIL = 'daniel.mendes@dataholics.io';  // ← SEU EMAIL

let currentUser = null;
let currentSearchData = null;
let pollInterval = null;
let searchStartTime = null;

// ============================================
// AGUARDAR FIREBASE CARREGAR
// ============================================

window.addEventListener('load', function() {
    console.log('✅ Window loaded, aguardando Firebase...');
    
    // Aguardar auth estar disponível
    const checkAuth = setInterval(() => {
        if (window.auth) {
            clearInterval(checkAuth);
            console.log('✅ Firebase Auth disponível!');
            initDashboard();
        }
    }, 100);
});

// ============================================
// INICIALIZAR DASHBOARD
// ============================================

function initDashboard() {
    console.log('🚀 Inicializando dashboard...');
    
    // Autenticação
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            window.location.href = 'index.html';
            return;
        }
        
        currentUser = user;
        console.log('👤 Usuário logado:', user.email);
        
        // Atualizar UI
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.displayName || user.email;
        }
        
        // Mostrar botão admin
        console.log('🔍 Verificando se é admin...');
        console.log('Email do usuário:', user.email);
        console.log('Email admin:', ADMIN_EMAIL);
        console.log('É admin?', user.email === ADMIN_EMAIL);
        
        if (user.email === ADMIN_EMAIL) {
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) {
                console.log('✅ Mostrando botão Admin');
                adminBtn.classList.remove('hidden');
            }
        }
    });
    
    // Event Listeners
    setupEventListeners();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    console.log('🔌 Configurando event listeners...');
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await auth.signOut();
            window.location.href = 'index.html';
        });
    }
    
    // Admin
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            window.location.href = 'admin.html';
        });
    }
    
    // Download JSON
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', () => {
            if (!currentSearchData) {
                alert('Nenhum dado disponível. Faça uma busca primeiro.');
                return;
            }
            
            const dataStr = JSON.stringify(currentSearchData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pharmyrus-${currentSearchData.metadata?.molecule_name || 'search'}-${Date.now()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert('✅ JSON baixado com sucesso!');
        });
    }
    
    // Busca
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearch);
    }
    
    // Tabs
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
        });
    });
    
    console.log('✅ Event listeners configurados!');
}

// ============================================
// BUSCA DE PATENTES
// ============================================

async function handleSearch(e) {
    e.preventDefault();
    
    const moleculeName = document.getElementById('moleculeName').value.trim();
    const brandName = document.getElementById('brandName').value.trim();
    
    if (!moleculeName) {
        alert('❌ Digite o nome da molécula');
        return;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 INICIANDO BUSCA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Molécula:', moleculeName);
    console.log('🏷️  Marca:', brandName || '(não informado)');
    console.log('🌐 API:', API_BASE_URL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // Esconder welcome, mostrar loading
    const welcomeContent = document.getElementById('welcomeContent');
    const loadingAnimation = document.getElementById('loadingAnimation');
    
    if (welcomeContent) welcomeContent.classList.add('hidden');
    if (loadingAnimation) loadingAnimation.classList.remove('hidden');
    
    searchStartTime = Date.now();
    
    try {
        // Iniciar busca assíncrona
        const initUrl = `${API_BASE_URL}/search/async`;
        const requestBody = {
            nome_molecula: moleculeName,
            nome_comercial: brandName || '',
            paises_alvo: ['BR'],
            incluir_wo: true
        };
        
        console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));
        console.log('🔗 POST', initUrl);
        
        const response = await fetch(initUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Task iniciada:', data);
        
        if (!data.task_id) {
            throw new Error('Task ID não retornado pela API');
        }
        
        // Iniciar polling
        startPolling(data.task_id);
        
    } catch (error) {
        console.error('❌ ERRO NA BUSCA:', error);
        if (loadingAnimation) loadingAnimation.classList.add('hidden');
        if (welcomeContent) welcomeContent.classList.remove('hidden');
        alert(`❌ Erro: ${error.message}\n\nVerifique:\n1. Railway está acordado?\n2. CORS configurado?\n3. URL correta?`);
    }
}

// ============================================
// POLLING DE STATUS
// ============================================

function startPolling(taskId) {
    console.log('🔄 Iniciando polling para task:', taskId);
    
    let pollCount = 0;
    const maxPolls = 900; // 30 minutos (2s interval)
    
    pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
            const statusUrl = `${API_BASE_URL}/search/async/${taskId}/status`;
            const response = await fetch(statusUrl);
            
            if (!response.ok) {
                console.warn(`⚠️  Status check failed: ${response.status}`);
                return;
            }
            
            const status = await response.json();
            console.log(`📊 Poll ${pollCount}:`, status.status || 'processing');
            
            // Se completou
            if (status.status === 'completed') {
                clearInterval(pollInterval);
                await fetchResults(taskId);
                return;
            }
            
            // Se falhou
            if (status.status === 'failed' || status.status === 'error') {
                clearInterval(pollInterval);
                throw new Error(status.error || 'Busca falhou');
            }
            
            // Timeout
            if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                throw new Error('Timeout: busca demorou mais de 30 minutos');
            }
            
        } catch (error) {
            clearInterval(pollInterval);
            console.error('❌ Erro no polling:', error);
            const loadingAnimation = document.getElementById('loadingAnimation');
            const welcomeContent = document.getElementById('welcomeContent');
            if (loadingAnimation) loadingAnimation.classList.add('hidden');
            if (welcomeContent) welcomeContent.classList.remove('hidden');
            alert(`❌ ${error.message}`);
        }
    }, 2000); // Poll a cada 2 segundos
}

// ============================================
// BUSCAR RESULTADOS
// ============================================

async function fetchResults(taskId) {
    try {
        console.log('📥 Buscando resultados...');
        
        const resultUrl = `${API_BASE_URL}/search/async/${taskId}/result`;
        const response = await fetch(resultUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch results: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ RESULTADOS RECEBIDOS:', data);
        
        currentSearchData = data;
        
        const loadingAnimation = document.getElementById('loadingAnimation');
        if (loadingAnimation) loadingAnimation.classList.add('hidden');
        
        // Mostrar botão download
        const downloadJsonBtn = document.getElementById('downloadJsonBtn');
        if (downloadJsonBtn) downloadJsonBtn.classList.remove('hidden');
        
        // Exibir resultados
        displayResults(data);
        
        const duration = Math.round((Date.now() - searchStartTime) / 1000);
        console.log(`⏱️  Tempo total: ${duration}s`);
        
    } catch (error) {
        console.error('❌ Erro ao buscar resultados:', error);
        const loadingAnimation = document.getElementById('loadingAnimation');
        const welcomeContent = document.getElementById('welcomeContent');
        if (loadingAnimation) loadingAnimation.classList.add('hidden');
        if (welcomeContent) welcomeContent.classList.remove('hidden');
        alert(`❌ ${error.message}`);
    }
}

// ============================================
// EXIBIR RESULTADOS
// ============================================

function displayResults(data) {
    console.log('📊 Exibindo resultados...');
    
    // Mudar para tab de historico (onde ficam os resultados)
    const historicoTab = document.querySelector('[data-tab="historico"]');
    if (historicoTab) historicoTab.click();
    
    // Inserir resultados na tab historico
    const historicoTabContent = document.getElementById('historicoTab');
    if (!historicoTabContent) {
        console.error('❌ Tab historico não encontrada');
        return;
    }
    
    // Extrair dados
    const metadata = data.metadata || {};
    const summary = data.patent_discovery?.summary || {};
    const patents = data.patent_discovery?.patents_by_country?.BR || [];
    
    // Renderizar
    historicoTabContent.innerHTML = `
        <div style="padding: 20px;">
            <!-- Header -->
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 28px; color: #1f2937; margin: 0;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    Busca Completa
                </h2>
                <p style="color: #6b7280; margin-top: 8px;">
                    ${metadata.molecule_name || 'N/A'}
                    ${metadata.brand_name ? `(${metadata.brand_name})` : ''}
                </p>
            </div>

            <!-- Summary Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #667eea;">${summary.total_wo_patents || 0}</div>
                    <div style="color: #6b7280; font-size: 14px;">WO Patents</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #f5576c;">${summary.total_patents || 0}</div>
                    <div style="color: #6b7280; font-size: 14px;">BR Patents</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #4facfe;">${summary.by_source?.WIPO || 0}</div>
                    <div style="color: #6b7280; font-size: 14px;">WIPO</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #43e97b;">${Math.round(metadata.elapsed_seconds || 0)}s</div>
                    <div style="color: #6b7280; font-size: 14px;">Tempo</div>
                </div>
            </div>

            <!-- Patents Table -->
            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-list"></i> Patentes Brasileiras (${patents.length})
                </h3>
                
                ${patents.length > 0 ? `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f9fafb;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Patente</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Título</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Data</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Links</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${patents.slice(0, 20).map(p => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 12px;"><strong>${p.patent_number || 'N/A'}</strong></td>
                                        <td style="padding: 12px; max-width: 300px;">${truncate(p.title || 'N/A', 60)}</td>
                                        <td style="padding: 12px;">${formatDate(p.filing_date)}</td>
                                        <td style="padding: 12px;">
                                            ${p.link_nacional ? `<a href="${p.link_nacional}" target="_blank" style="padding: 4px 8px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; margin-right: 4px;">INPI</a>` : ''}
                                            ${p.link_espacenet ? `<a href="${p.link_espacenet}" target="_blank" style="padding: 4px 8px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">EPO</a>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${patents.length > 20 ? `<p style="text-align: center; color: #6b7280; margin-top: 16px;">Mostrando 20 de ${patents.length} patentes</p>` : ''}
                ` : `
                    <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: #d1d5db;"></i>
                        <p>Nenhuma patente brasileira encontrada</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    alert('✅ Busca concluída com sucesso!');
}

// ============================================
// HELPERS
// ============================================

function truncate(str, len) {
    if (!str) return 'N/A';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
        return dateStr;
    }
}

console.log('✅ Dashboard script carregado! Aguardando Firebase...');
