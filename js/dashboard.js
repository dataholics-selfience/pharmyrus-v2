// ============================================
// PHARMYRUS v32.0 - Dashboard Script
// ============================================

console.log('🚀 Pharmyrus Dashboard v32.0 carregando...');

// ============================================
// CONFIGURAÇÃO
// ============================================

const PHARMYRUS_API_URL = 'https://pharmyrus-total31-production-b8b1.up.railway.app';
const PHARMYRUS_ADMIN_EMAIL = 'daniel.mendes@dataholics.io';

let pharmyrusCurrentUser = null;
let pharmyrusSearchData = null;
let pharmyrusPollInterval = null;
let pharmyrusSearchStartTime = null;

// ============================================
// AGUARDAR FIREBASE CARREGAR
// ============================================

(function() {
    'use strict';
    
    console.log('⏳ Aguardando Firebase carregar...');
    
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos
    
    const waitForFirebase = setInterval(() => {
        attempts++;
        
        if (window.auth && window.db) {
            clearInterval(waitForFirebase);
            console.log('✅ Firebase carregado!');
            initializePharmyrusDashboard();
        } else if (attempts >= maxAttempts) {
            clearInterval(waitForFirebase);
            console.error('❌ Timeout aguardando Firebase');
            alert('Erro ao carregar Firebase. Recarregue a página.');
        }
    }, 100);
})();

// ============================================
// INICIALIZAR DASHBOARD
// ============================================

function initializePharmyrusDashboard() {
    console.log('🎯 Inicializando Pharmyrus Dashboard...');
    
    // Auth state
    window.auth.onAuthStateChanged((user) => {
        if (!user) {
            console.log('❌ Usuário não autenticado, redirecionando...');
            window.location.href = 'index.html';
            return;
        }
        
        pharmyrusCurrentUser = user;
        console.log('👤 Usuário:', user.email);
        
        // Nome do usuário
        const userNameEl = document.getElementById('userName');
        if (userNameEl) {
            userNameEl.textContent = user.displayName || user.email;
        }
        
        // Verificar se é admin
        console.log('🔍 Verificando admin...');
        console.log('   User email:', user.email);
        console.log('   Admin email:', PHARMYRUS_ADMIN_EMAIL);
        
        if (user.email === PHARMYRUS_ADMIN_EMAIL) {
            console.log('✅ ADMIN DETECTADO! Mostrando botão...');
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) {
                adminBtn.classList.remove('hidden');
                console.log('✅ Botão admin exibido');
            } else {
                console.error('❌ Elemento adminBtn não encontrado no DOM');
            }
        } else {
            console.log('ℹ️  Não é admin, botão permanece oculto');
        }
    });
    
    // Event listeners
    setupPharmyrusEventListeners();
    
    console.log('✅ Dashboard inicializado!');
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupPharmyrusEventListeners() {
    console.log('🔌 Configurando event listeners...');
    
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            console.log('🚪 Logout...');
            await window.auth.signOut();
            window.location.href = 'index.html';
        });
    }
    
    // Admin
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', () => {
            console.log('⚙️  Abrindo admin...');
            window.location.href = 'admin.html';
        });
    }
    
    // Download JSON
    const downloadJsonBtn = document.getElementById('downloadJsonBtn');
    if (downloadJsonBtn) {
        downloadJsonBtn.addEventListener('click', () => {
            if (!pharmyrusSearchData) {
                alert('❌ Nenhum dado disponível. Faça uma busca primeiro.');
                return;
            }
            
            const dataStr = JSON.stringify(pharmyrusSearchData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            
            const moleculeName = pharmyrusSearchData.metadata?.molecule_name || 'search';
            link.download = `pharmyrus-${moleculeName}-${Date.now()}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            console.log('✅ JSON baixado');
            alert('✅ JSON baixado com sucesso!');
        });
    }
    
    // Busca
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handlePharmyrusSearch);
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
}

// ============================================
// BUSCA
// ============================================

async function handlePharmyrusSearch(e) {
    e.preventDefault();
    
    const moleculeName = document.getElementById('moleculeName')?.value.trim();
    const brandName = document.getElementById('brandName')?.value.trim();
    
    if (!moleculeName) {
        alert('❌ Digite o nome da molécula');
        return;
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔍 INICIANDO BUSCA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Molécula:', moleculeName);
    console.log('🏷️  Marca:', brandName || '(não informado)');
    console.log('🌐 API:', PHARMYRUS_API_URL);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // UI: esconder welcome, mostrar loading
    const welcomeContent = document.getElementById('welcomeContent');
    const loadingAnimation = document.getElementById('loadingAnimation');
    
    if (welcomeContent) welcomeContent.classList.add('hidden');
    if (loadingAnimation) loadingAnimation.classList.remove('hidden');
    
    pharmyrusSearchStartTime = Date.now();
    
    try {
        const initUrl = `${PHARMYRUS_API_URL}/search/async`;
        const requestBody = {
            nome_molecula: moleculeName,
            nome_comercial: brandName || '',
            paises_alvo: ['BR'],
            incluir_wo: true
        };
        
        console.log('📤 POST', initUrl);
        console.log('📦 Body:', JSON.stringify(requestBody, null, 2));
        
        const response = await fetch(initUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => 'Sem detalhes');
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        const data = await response.json();
        console.log('✅ Resposta:', data);
        
        if (!data.task_id) {
            throw new Error('API não retornou task_id');
        }
        
        console.log('🆔 Task ID:', data.task_id);
        startPharmyrusPolling(data.task_id);
        
    } catch (error) {
        console.error('❌ ERRO:', error);
        
        if (loadingAnimation) loadingAnimation.classList.add('hidden');
        if (welcomeContent) welcomeContent.classList.remove('hidden');
        
        let errorMsg = error.message;
        if (errorMsg.includes('Failed to fetch')) {
            errorMsg = 'Erro de conexão. Verifique:\n\n1. Railway está acordado?\n2. CORS configurado no backend?\n3. URL da API correta?';
        }
        
        alert(`❌ Erro na busca:\n\n${errorMsg}`);
    }
}

// ============================================
// POLLING
// ============================================

function startPharmyrusPolling(taskId) {
    console.log('🔄 Iniciando polling, task:', taskId);
    
    let pollCount = 0;
    const maxPolls = 900; // 30 minutos
    
    pharmyrusPollInterval = setInterval(async () => {
        pollCount++;
        
        try {
            const statusUrl = `${PHARMYRUS_API_URL}/search/async/${taskId}/status`;
            const response = await fetch(statusUrl);
            
            if (!response.ok) {
                console.warn(`⚠️  Status ${response.status}`);
                return;
            }
            
            const status = await response.json();
            console.log(`📊 Poll ${pollCount}: ${status.status || 'processing'}`);
            
            if (status.status === 'completed') {
                clearInterval(pharmyrusPollInterval);
                console.log('✅ Busca completa!');
                await fetchPharmyrusResults(taskId);
                return;
            }
            
            if (status.status === 'failed' || status.status === 'error') {
                clearInterval(pharmyrusPollInterval);
                throw new Error(status.error || 'Busca falhou');
            }
            
            if (pollCount >= maxPolls) {
                clearInterval(pharmyrusPollInterval);
                throw new Error('Timeout: mais de 30 minutos');
            }
            
        } catch (error) {
            clearInterval(pharmyrusPollInterval);
            console.error('❌ Erro polling:', error);
            
            const loadingAnimation = document.getElementById('loadingAnimation');
            const welcomeContent = document.getElementById('welcomeContent');
            
            if (loadingAnimation) loadingAnimation.classList.add('hidden');
            if (welcomeContent) welcomeContent.classList.remove('hidden');
            
            alert(`❌ ${error.message}`);
        }
    }, 2000);
}

// ============================================
// RESULTADOS
// ============================================

async function fetchPharmyrusResults(taskId) {
    try {
        console.log('📥 Buscando resultados...');
        
        const resultUrl = `${PHARMYRUS_API_URL}/search/async/${taskId}/result`;
        const response = await fetch(resultUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Resultados recebidos!');
        
        pharmyrusSearchData = data;
        
        // Esconder loading
        const loadingAnimation = document.getElementById('loadingAnimation');
        if (loadingAnimation) loadingAnimation.classList.add('hidden');
        
        // Mostrar botão download
        const downloadJsonBtn = document.getElementById('downloadJsonBtn');
        if (downloadJsonBtn) downloadJsonBtn.classList.remove('hidden');
        
        // Exibir resultados
        displayPharmyrusResults(data);
        
        const duration = Math.round((Date.now() - pharmyrusSearchStartTime) / 1000);
        console.log(`⏱️  Tempo total: ${duration}s`);
        
    } catch (error) {
        console.error('❌ Erro resultados:', error);
        
        const loadingAnimation = document.getElementById('loadingAnimation');
        const welcomeContent = document.getElementById('welcomeContent');
        
        if (loadingAnimation) loadingAnimation.classList.add('hidden');
        if (welcomeContent) welcomeContent.classList.remove('hidden');
        
        alert(`❌ Erro ao buscar resultados: ${error.message}`);
    }
}

// ============================================
// EXIBIR RESULTADOS
// ============================================

function displayPharmyrusResults(data) {
    console.log('📊 Exibindo resultados...');
    
    // Mudar para tab historico
    const historicoTab = document.querySelector('[data-tab="historico"]');
    if (historicoTab) historicoTab.click();
    
    const historicoTabContent = document.getElementById('historicoTab');
    if (!historicoTabContent) {
        console.error('❌ Tab historico não encontrada');
        alert('❌ Erro ao exibir resultados: tab não encontrada');
        return;
    }
    
    const metadata = data.metadata || {};
    const summary = data.patent_discovery?.summary || {};
    const patents = data.patent_discovery?.patents_by_country?.BR || [];
    
    historicoTabContent.innerHTML = `
        <div style="padding: 20px;">
            <div style="margin-bottom: 30px;">
                <h2 style="font-size: 28px; color: #1f2937; margin: 0;">
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    Busca Completa
                </h2>
                <p style="color: #6b7280; margin-top: 8px; font-size: 16px;">
                    ${metadata.molecule_name || 'N/A'}
                    ${metadata.brand_name ? `(${metadata.brand_name})` : ''}
                </p>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #667eea;">${summary.total_wo_patents || 0}</div>
                    <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">WO Patents</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #f5576c;">${summary.total_patents || 0}</div>
                    <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">BR Patents</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #4facfe;">${summary.wipo_wos || 0}</div>
                    <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">WIPO WOs</div>
                </div>
                <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 32px; font-weight: 700; color: #43e97b;">${Math.round(metadata.elapsed_seconds || 0)}s</div>
                    <div style="color: #6b7280; font-size: 14px; margin-top: 4px;">Tempo</div>
                </div>
            </div>

            <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <h3 style="margin-bottom: 16px; font-size: 20px; color: #1f2937;">
                    <i class="fas fa-list"></i> Patentes Brasileiras (${patents.length})
                </h3>
                
                ${patents.length > 0 ? `
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f9fafb;">
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Patente</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Título</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Data</th>
                                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; font-weight: 600; color: #374151;">Links</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${patents.slice(0, 20).map(p => `
                                    <tr style="border-bottom: 1px solid #e5e7eb;">
                                        <td style="padding: 12px;"><strong>${p.patent_number || 'N/A'}</strong></td>
                                        <td style="padding: 12px; max-width: 300px;">${truncatePharmyrus(p.title || 'N/A', 60)}</td>
                                        <td style="padding: 12px;">${formatPharmyrusDate(p.filing_date)}</td>
                                        <td style="padding: 12px;">
                                            ${p.link_nacional ? `<a href="${p.link_nacional}" target="_blank" style="padding: 4px 8px; background: #667eea; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; margin-right: 4px; display: inline-block;">INPI</a>` : ''}
                                            ${p.link_espacenet ? `<a href="${p.link_espacenet}" target="_blank" style="padding: 4px 8px; background: #10b981; color: white; text-decoration: none; border-radius: 4px; font-size: 12px; display: inline-block;">EPO</a>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${patents.length > 20 ? `<p style="text-align: center; color: #6b7280; margin-top: 16px; font-size: 14px;">Mostrando 20 de ${patents.length} patentes</p>` : ''}
                ` : `
                    <div style="text-align: center; padding: 60px 20px; color: #6b7280;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: #d1d5db; display: block; margin-bottom: 16px;"></i>
                        <p style="font-size: 16px;">Nenhuma patente brasileira encontrada</p>
                    </div>
                `}
            </div>
        </div>
    `;
    
    console.log('✅ Resultados exibidos!');
    alert(`✅ Busca concluída!\n\n${summary.total_wo_patents || 0} WO patents\n${summary.total_patents || 0} BR patents`);
}

// ============================================
// UTILS
// ============================================

function truncatePharmyrus(str, len) {
    if (!str) return 'N/A';
    return str.length > len ? str.substring(0, len) + '...' : str;
}

function formatPharmyrusDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch {
        return dateStr;
    }
}

console.log('✅ Pharmyrus Dashboard script carregado!');
