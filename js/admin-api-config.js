/**
 * Admin API Configuration Extension
 * ==================================
 * 
 * Adiciona funcionalidade de configuração de API ao painel admin
 * Preserva 100% da funcionalidade existente
 */

(function() {
    'use strict';
    
    console.log('📡 Loading Admin API Configuration...');
    
    // Aguardar DOM e auth
    document.addEventListener('DOMContentLoaded', function() {
        initApiConfiguration();
    });
    
    async function initApiConfiguration() {
        // Verificar se elementos existem
        const form = document.getElementById('apiConfigForm');
        const testBtn = document.getElementById('testApiBtn');
        const input = document.getElementById('apiBaseUrl');
        
        if (!form || !testBtn || !input) {
            console.log('ℹ️  API config elements not found (not on API tab)');
            return;
        }
        
        console.log('✅ Initializing API Configuration');
        
        // Carregar URL atual
        await loadCurrentApiUrl();
        
        // Event listeners
        form.addEventListener('submit', handleSaveApiUrl);
        testBtn.addEventListener('click', handleTestConnection);
        
        // Auto-test on load
        setTimeout(() => testCurrentApi(), 1000);
    }
    
    /**
     * Carrega URL atual da API
     */
    async function loadCurrentApiUrl() {
        try {
            const url = await window.getApiBaseUrl();
            const cleanUrl = url.replace(/^https?:\/\//, '');
            
            const input = document.getElementById('apiBaseUrl');
            const currentUrlDisplay = document.getElementById('currentApiUrl');
            
            if (input) {
                input.value = cleanUrl;
            }
            
            if (currentUrlDisplay) {
                currentUrlDisplay.textContent = cleanUrl;
            }
            
            console.log(`📡 Current API URL: ${cleanUrl}`);
            
        } catch (error) {
            console.error('❌ Error loading API URL:', error);
        }
    }
    
    /**
     * Salva nova URL da API
     */
    async function handleSaveApiUrl(e) {
        e.preventDefault();
        
        const input = document.getElementById('apiBaseUrl');
        const url = input.value.trim();
        
        if (!url) {
            alert('❌ URL não pode estar vazia');
            return;
        }
        
        try {
            showNotification('💾 Salvando configuração...', 'info');
            
            await window.apiConfigManager.saveApiUrl(url);
            
            showNotification('✅ Configuração salva com sucesso!', 'success');
            
            // Atualizar display
            await loadCurrentApiUrl();
            
            // Testar nova URL
            await testCurrentApi();
            
            // Sugerir reload
            if (confirm('✅ Configuração salva!\n\nDeseja recarregar a página para aplicar?')) {
                window.location.reload();
            }
            
        } catch (error) {
            console.error('❌ Error saving API URL:', error);
            showNotification('❌ Erro ao salvar: ' + error.message, 'error');
        }
    }
    
    /**
     * Testa conexão com API
     */
    async function handleTestConnection() {
        const input = document.getElementById('apiBaseUrl');
        const url = input.value.trim();
        
        if (!url) {
            alert('❌ URL não pode estar vazia');
            return;
        }
        
        const resultDiv = document.getElementById('apiTestResult');
        
        try {
            // Mostrar loading
            resultDiv.classList.remove('hidden');
            resultDiv.innerHTML = `
                <div class="test-loading">
                    🔄 Testando conexão com ${url}...
                </div>
            `;
            
            // Testar
            const result = await window.apiConfigManager.testConnection(url);
            
            // Mostrar resultado
            if (result.success) {
                resultDiv.innerHTML = `
                    <div class="test-success">
                        ✅ ${result.message}
                        <br>
                        <small>Status: ${result.status} | Versão: ${result.version}</small>
                    </div>
                `;
            } else {
                resultDiv.innerHTML = `
                    <div class="test-error">
                        ❌ ${result.message}
                        <br>
                        <small>Verifique a URL e tente novamente</small>
                    </div>
                `;
            }
            
        } catch (error) {
            console.error('❌ Test error:', error);
            resultDiv.innerHTML = `
                <div class="test-error">
                    ❌ Erro ao testar: ${error.message}
                </div>
            `;
        }
    }
    
    /**
     * Testa API atual (auto)
     */
    async function testCurrentApi() {
        try {
            const result = await window.apiConfigManager.testConnection();
            
            const statusEl = document.getElementById('apiStatus');
            const versionEl = document.getElementById('apiVersion');
            
            if (result.success) {
                if (statusEl) {
                    statusEl.textContent = '✅ Online';
                    statusEl.style.color = '#10b981';
                }
                if (versionEl) {
                    versionEl.textContent = result.version || 'N/A';
                }
            } else {
                if (statusEl) {
                    statusEl.textContent = '❌ Offline';
                    statusEl.style.color = '#ef4444';
                }
            }
            
        } catch (error) {
            console.error('❌ Auto-test error:', error);
        }
    }
    
    /**
     * Show notification (fallback se não existir)
     */
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    console.log('✅ Admin API Configuration loaded');
})();
