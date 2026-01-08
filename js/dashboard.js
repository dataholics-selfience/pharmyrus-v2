// ============================================
// PHARMYRUS v32.0 - Dashboard Script
// ============================================

console.log('Pharmyrus v32.0 Dashboard loaded');

// ============================================
// CONFIGURAÇÃO
// ============================================

const API_BASE_URL = 'https://pharmyrus-total31-production-b8b1.up.railway.app';
const ADMIN_EMAIL = 'admin@pharmyrus.com';

let currentUser = null;
let currentSearchData = null;
let pollInterval = null;

// ============================================
// AUTENTICAÇÃO
// ============================================

auth.onAuthStateChanged(async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = user;
    
    // Atualizar UI
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.displayName || user.email;
    }
    
    // Mostrar botão admin se for admin
    if (user.email === ADMIN_EMAIL) {
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.classList.remove('hidden');
        }
    }
});

// ============================================
// EVENT LISTENERS
// ============================================

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    await auth.signOut();
    window.location.href = 'index.html';
});

// Admin
document.getElementById('adminBtn')?.addEventListener('click', () => {
    window.location.href = 'admin.html';
});

// Download JSON
document.getElementById('downloadJsonBtn')?.addEventListener('click', () => {
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
    
    showNotification('✅ JSON baixado com sucesso!', 'success');
});

// Busca
document.getElementById('searchForm')?.addEventListener('submit', handleSearch);

// ============================================
// BUSCA DE PATENTES
// ============================================

async function handleSearch(e) {
    e.preventDefault();
    
    const moleculeName = document.getElementById('moleculeName').value.trim();
    const brandName = document.getElementById('brandName').value.trim();
    
    if (!moleculeName) {
        showNotification('❌ Digite o nome da molécula', 'error');
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
    hideElement('welcomeContent');
    showElement('loadingState');
    
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
        hideElement('loadingState');
        showElement('welcomeContent');
        showNotification(`❌ Erro: ${error.message}`, 'error');
    }
}

// ============================================
// POLLING DE STATUS
// ============================================

function startPolling(taskId) {
    console.log('🔄 Iniciando polling para task:', taskId);
    
    updateLoadingMessage('🔄 Processando busca...', 'Aguardando resposta da API...');
    
    let pollCount = 0;
    const maxPolls = 900; // 30 minutos (2s interval)
    
    pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
            const statusUrl = `${API_BASE_URL}/search/async/${taskId}/status`;
            const response = await fetch(statusUrl);
            
            if (!response.ok) {
                throw new Error(`Status check failed: ${response.status}`);
            }
            
            const status = await response.json();
            console.log(`📊 Poll ${pollCount}:`, status);
            
            updateLoadingMessage(
                `🔄 ${status.status || 'Processando'}...`,
                status.message || `Tentativa ${pollCount} de ${maxPolls}`
            );
            
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
            hideElement('loadingState');
            showElement('welcomeContent');
            showNotification(`❌ ${error.message}`, 'error');
        }
    }, 2000); // Poll a cada 2 segundos
}

// ============================================
// BUSCAR RESULTADOS
// ============================================

async function fetchResults(taskId) {
    try {
        updateLoadingMessage('📥 Buscando resultados...', 'Carregando dados...');
        
        const resultUrl = `${API_BASE_URL}/search/async/${taskId}/result`;
        const response = await fetch(resultUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch results: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ RESULTADOS:', data);
        
        currentSearchData = data;
        
        hideElement('loadingState');
        displayResults(data);
        
    } catch (error) {
        console.error('❌ Erro ao buscar resultados:', error);
        hideElement('loadingState');
        showElement('welcomeContent');
        showNotification(`❌ ${error.message}`, 'error');
    }
}

// ============================================
// EXIBIR RESULTADOS
// ============================================

function displayResults(data) {
    console.log('📊 Exibindo resultados...');
    
    // Mostrar botão de download JSON
    const downloadBtn = document.getElementById('downloadJsonBtn');
    if (downloadBtn) {
        downloadBtn.classList.remove('hidden');
    }
    
    // Mudar para tab de resultados
    document.querySelector('[data-tab="resultados"]')?.click();
    
    const container = document.getElementById('resultsContainer');
    if (!container) return;
    
    // Extrair dados
    const metadata = data.metadata || {};
    const summary = data.patent_discovery?.summary || {};
    const patents = data.patent_discovery?.patents_by_country?.BR || [];
    const families = data.patent_discovery?.patent_families || [];
    
    // Renderizar
    container.innerHTML = `
        <div class="results-wrapper">
            <!-- Header -->
            <div class="results-header">
                <h2>
                    <i class="fas fa-check-circle" style="color: #10b981;"></i>
                    Busca Completa
                </h2>
                <p style="color: #6b7280; margin-top: 8px;">
                    ${metadata.molecule_name || 'N/A'}
                    ${metadata.brand_name ? `(${metadata.brand_name})` : ''}
                </p>
            </div>

            <!-- Summary Cards -->
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${summary.total_wo_patents || 0}</h3>
                        <p>WO Patents</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                        <i class="fas fa-flag"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${summary.total_patents || 0}</h3>
                        <p>BR Patents</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                        <i class="fas fa-database"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${families.length || 0}</h3>
                        <p>Families</p>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="summary-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="summary-content">
                        <h3>${Math.round(metadata.elapsed_seconds || 0)}s</h3>
                        <p>Tempo</p>
                    </div>
                </div>
            </div>

            <!-- Patents Table -->
            <div class="patents-section">
                <h3 style="margin-bottom: 16px;">
                    <i class="fas fa-list"></i> Patentes Brasileiras (${patents.length})
                </h3>
                
                ${patents.length > 0 ? `
                    <div class="patents-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Patente</th>
                                    <th>Título</th>
                                    <th>Data</th>
                                    <th>Status</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${patents.slice(0, 20).map(p => `
                                    <tr>
                                        <td><strong>${p.patent_number || 'N/A'}</strong></td>
                                        <td style="max-width: 300px;">${truncate(p.title || 'N/A', 60)}</td>
                                        <td>${formatDate(p.filing_date)}</td>
                                        <td>
                                            <span class="status-badge ${getStatusClass(p.patent_status)}">
                                                ${p.patent_status || 'Unknown'}
                                            </span>
                                        </td>
                                        <td>
                                            ${p.link_nacional ? `<a href="${p.link_nacional}" target="_blank" class="btn-link">INPI</a>` : ''}
                                            ${p.link_espacenet ? `<a href="${p.link_espacenet}" target="_blank" class="btn-link">EPO</a>` : ''}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    ${patents.length > 20 ? `<p style="text-align: center; color: #6b7280; margin-top: 16px;">Mostrando 20 de ${patents.length} patentes</p>` : ''}
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-inbox" style="font-size: 48px; color: #d1d5db;"></i>
                        <p>Nenhuma patente brasileira encontrada</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

// ============================================
// HELPERS
// ============================================

function showElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
}

function hideElement(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

function updateLoadingMessage(title, details) {
    const titleEl = document.getElementById('loadingMessage');
    const detailsEl = document.getElementById('loadingDetails');
    
    if (titleEl) titleEl.textContent = title;
    if (detailsEl) detailsEl.textContent = details;
}

function showNotification(message, type = 'info') {
    alert(message); // Simplificado - pode melhorar depois
}

function truncate(str, len) {
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

function getStatusClass(status) {
    if (!status) return 'status-unknown';
    const s = status.toLowerCase();
    if (s.includes('safe') || s.includes('active')) return 'status-safe';
    if (s.includes('expir') || s.includes('dead')) return 'status-expired';
    return 'status-unknown';
}

// ============================================
// CSS INLINE (TEMPORÁRIO)
// ============================================

const style = document.createElement('style');
style.textContent = `
    .hidden { display: none !important; }
    
    .loading-state {
        text-align: center;
        padding: 60px 20px;
    }
    
    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid #e5e7eb;
        border-top: 4px solid #667eea;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loading-details {
        color: #6b7280;
        font-size: 14px;
        margin-top: 8px;
    }
    
    .results-wrapper {
        padding: 20px;
    }
    
    .results-header h2 {
        font-size: 28px;
        color: #1f2937;
        margin: 0;
    }
    
    .summary-cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 30px 0;
    }
    
    .summary-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .summary-icon {
        width: 60px;
        height: 60px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 24px;
    }
    
    .summary-content h3 {
        font-size: 32px;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
    }
    
    .summary-content p {
        color: #6b7280;
        font-size: 14px;
        margin: 4px 0 0 0;
    }
    
    .patents-section {
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    
    .patents-table {
        overflow-x: auto;
    }
    
    .patents-table table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .patents-table th {
        background: #f9fafb;
        padding: 12px;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
    }
    
    .patents-table td {
        padding: 12px;
        border-bottom: 1px solid #e5e7eb;
    }
    
    .patents-table tr:hover {
        background: #f9fafb;
    }
    
    .status-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
    }
    
    .status-safe {
        background: #d1fae5;
        color: #065f46;
    }
    
    .status-expired {
        background: #fee2e2;
        color: #991b1b;
    }
    
    .status-unknown {
        background: #e5e7eb;
        color: #374151;
    }
    
    .btn-link {
        padding: 4px 12px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        margin-right: 4px;
        display: inline-block;
    }
    
    .btn-link:hover {
        background: #5568d3;
    }
    
    .empty-state {
        text-align: center;
        padding: 60px 20px;
        color: #6b7280;
    }
    
    .welcome-content {
        padding: 40px 20px;
    }
    
    .welcome-hero {
        text-align: center;
        margin-bottom: 40px;
    }
    
    .welcome-title {
        font-size: 36px;
        color: #1f2937;
        margin-bottom: 16px;
    }
    
    .welcome-subtitle {
        font-size: 20px;
        color: #6b7280;
        margin-bottom: 12px;
    }
    
    .welcome-description {
        font-size: 16px;
        color: #9ca3af;
    }
    
    .features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
    }
    
    .feature-card {
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
    }
    
    .feature-icon {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 32px;
        margin: 0 auto 20px;
    }
    
    .feature-card h3 {
        font-size: 18px;
        color: #1f2937;
        margin-bottom: 8px;
    }
    
    .feature-card p {
        color: #6b7280;
        font-size: 14px;
    }
`;
document.head.appendChild(style);

console.log('✅ Dashboard ready!');
