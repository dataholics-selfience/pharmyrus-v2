/**
 * API Configuration Manager
 * =========================
 * 
 * Gerencia URL da API de forma dinâmica via Firestore
 * Permite admin trocar API sem tocar no código
 */

class ApiConfigManager {
    constructor() {
        this.defaultUrl = 'pharmyrus-total31-production-b8b1.up.railway.app';
        this.cachedUrl = null;
        this.lastFetch = 0;
        this.cacheDuration = 5 * 60 * 1000; // 5 minutos
    }
    
    /**
     * Obtém URL base da API
     * Ordem de prioridade:
     * 1. Firestore (se disponível)
     * 2. LocalStorage (cache)
     * 3. Default hardcoded
     */
    async getApiBaseUrl() {
        try {
            // Se tem cache válido, usa
            if (this.cachedUrl && Date.now() - this.lastFetch < this.cacheDuration) {
                return this.formatUrl(this.cachedUrl);
            }
            
            // Tentar buscar do Firestore
            if (window.db) {
                const doc = await db.collection('settings').doc('api').get();
                
                if (doc.exists) {
                    const data = doc.data();
                    const url = data.baseUrl || this.defaultUrl;
                    
                    // Cachear
                    this.cachedUrl = url;
                    this.lastFetch = Date.now();
                    localStorage.setItem('pharmyrus_api_url', url);
                    
                    console.log(`✅ API URL from Firestore: ${url}`);
                    return this.formatUrl(url);
                }
            }
            
            // Fallback: LocalStorage
            const stored = localStorage.getItem('pharmyrus_api_url');
            if (stored) {
                console.log(`📦 API URL from localStorage: ${stored}`);
                return this.formatUrl(stored);
            }
            
            // Fallback: Default
            console.log(`🔧 Using default API URL: ${this.defaultUrl}`);
            return this.formatUrl(this.defaultUrl);
            
        } catch (error) {
            console.error('❌ Error getting API URL:', error);
            return this.formatUrl(this.defaultUrl);
        }
    }
    
    /**
     * Salva nova URL da API no Firestore
     */
    async saveApiUrl(url) {
        try {
            // Remover https:// se presente
            const cleanUrl = url.replace(/^https?:\/\//, '');
            
            if (!window.db) {
                throw new Error('Firestore not initialized');
            }
            
            await db.collection('settings').doc('api').set({
                baseUrl: cleanUrl,
                updatedAt: new Date().toISOString(),
                updatedBy: window.currentUser?.email || 'unknown'
            });
            
            // Limpar cache
            this.cachedUrl = null;
            this.lastFetch = 0;
            localStorage.setItem('pharmyrus_api_url', cleanUrl);
            
            console.log(`✅ API URL saved: ${cleanUrl}`);
            return true;
            
        } catch (error) {
            console.error('❌ Error saving API URL:', error);
            throw error;
        }
    }
    
    /**
     * Formata URL para uso (adiciona https://)
     */
    formatUrl(url) {
        // Remove qualquer protocolo existente
        let clean = url.replace(/^https?:\/\//, '');
        
        // Remove trailing slashes
        clean = clean.replace(/\/+$/, '');
        
        // Adiciona https://
        return `https://${clean}`;
    }
    
    /**
     * Testa conectividade com API
     */
    async testConnection(url = null) {
        try {
            const testUrl = url || await this.getApiBaseUrl();
            
            console.log(`🔍 Testing API connection: ${testUrl}`);
            
            const response = await fetch(`${testUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ API connection OK:`, data);
                return {
                    success: true,
                    status: data.status || 'healthy',
                    version: data.version || 'unknown',
                    message: 'Conexão estabelecida com sucesso!'
                };
            } else {
                return {
                    success: false,
                    message: `Erro HTTP ${response.status}: ${response.statusText}`
                };
            }
            
        } catch (error) {
            console.error('❌ API connection test failed:', error);
            return {
                success: false,
                message: `Erro de conexão: ${error.message}`
            };
        }
    }
    
    /**
     * Limpa cache
     */
    clearCache() {
        this.cachedUrl = null;
        this.lastFetch = 0;
        localStorage.removeItem('pharmyrus_api_url');
        console.log('🗑️  API cache cleared');
    }
}

// Criar instância global
window.apiConfigManager = new ApiConfigManager();

// Helper function global
window.getApiBaseUrl = async function() {
    return await window.apiConfigManager.getApiBaseUrl();
};

console.log('✅ ApiConfigManager loaded');
