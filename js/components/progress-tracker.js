/**
 * Progress Tracker Component
 * ==========================
 * 
 * Componente de progresso em tempo real com:
 * - Progress bar visual (0-100%)
 * - Labels dinâmicas por estágio
 * - Persistência em localStorage (sobrevive refresh)
 * - Não bloqueante
 * - Polling assíncrono via API
 */

class ProgressTracker {
    constructor(containerId = 'progressContainer') {
        this.container = document.getElementById(containerId);
        this.currentProgress = 0;
        this.currentStage = 'initializing';
        this.taskId = null;
        this.pollInterval = null;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.warn('⚠️  Progress container not found');
            return;
        }
        
        // Restaurar estado de localStorage (sobrevivência a refresh)
        this.restoreState();
        
        // Renderizar UI
        this.render();
    }
    
    /**
     * Inicia tracking de uma nova busca
     */
    startTracking(taskId) {
        console.log(`🎯 Starting progress tracking for task: ${taskId}`);
        
        this.taskId = taskId;
        this.currentProgress = 0;
        this.currentStage = 'initializing';
        
        this.saveState();
        this.show();
        this.render();
        
        // Iniciar polling
        this.startPolling();
    }
    
    /**
     * Para tracking
     */
    stopTracking() {
        console.log('⏹️  Stopping progress tracking');
        
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        
        this.clearState();
    }
    
    /**
     * Completa progresso
     */
    complete() {
        this.updateProgress(100, 'complete', 'Análise completa!');
        setTimeout(() => {
            this.hide();
            this.stopTracking();
        }, 2000);
    }
    
    /**
     * Atualiza progresso
     */
    updateProgress(percentage, stage = null, message = null) {
        this.currentProgress = Math.min(100, Math.max(0, percentage));
        
        if (stage) {
            this.currentStage = stage;
        }
        
        this.saveState();
        this.render();
        
        console.log(`📊 Progress: ${this.currentProgress}% - ${message || this.getStageLabel()}`);
    }
    
    /**
     * Polling de status via API
     */
    startPolling() {
        if (!this.taskId) {
            console.error('❌ No taskId for polling');
            return;
        }
        
        // Parar polling anterior
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        
        // Polling a cada 2 segundos
        this.pollInterval = setInterval(async () => {
            try {
                await this.pollStatus();
            } catch (error) {
                console.error('❌ Poll error:', error);
            }
        }, 2000);
        
        // Poll imediato
        this.pollStatus();
    }
    
    /**
     * Faz polling do status
     */
    async pollStatus() {
        if (!this.taskId) return;
        
        try {
            const apiUrl = await window.getApiBaseUrl();
            const response = await fetch(`${apiUrl}/search/status/${this.taskId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn(`⚠️  Status poll failed: ${response.status}`);
                return;
            }
            
            const data = await response.json();
            
            // Atualizar progresso
            if (data.progress !== undefined) {
                this.updateProgress(
                    data.progress,
                    data.stage || null,
                    data.message || null
                );
            }
            
            // Se completou, para polling
            if (data.status === 'completed' || data.progress >= 100) {
                this.complete();
            }
            
            // Se falhou, para polling
            if (data.status === 'failed' || data.status === 'error') {
                this.stopTracking();
                this.hide();
            }
            
        } catch (error) {
            console.error('❌ Poll status error:', error);
        }
    }
    
    /**
     * Renderiza UI
     */
    render() {
        if (!this.container) return;
        
        const stageLabel = this.getStageLabel();
        const percentage = Math.round(this.currentProgress);
        
        this.container.innerHTML = `
            <div class="progress-tracker">
                <div class="progress-header">
                    <span class="progress-label">${stageLabel}</span>
                    <span class="progress-percentage">${percentage}%</span>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="progress-footer">
                    <small class="text-muted">
                        ${this.getStageDescription()}
                    </small>
                </div>
            </div>
        `;
    }
    
    /**
     * Obtém label do estágio atual
     */
    getStageLabel() {
        const p = this.currentProgress;
        
        if (p < 5) return '🔄 Inicializando...';
        if (p < 10) return '🌐 Buscando WIPO PCT...';
        if (p < 20) return '🔵 Buscando EPO OPS...';
        if (p < 40) return '🟢 Validando via Google Patents...';
        if (p < 70) return '🇧🇷 Buscando INPI Brasil...';
        if (p < 82) return '📋 Enriquecendo dados INPI...';
        if (p < 90) return '🔀 Consolidando famílias...';
        if (p < 100) return '✨ Finalizando análise...';
        return '✅ Análise completa!';
    }
    
    /**
     * Obtém descrição do estágio
     */
    getStageDescription() {
        const p = this.currentProgress;
        
        if (p < 5) return 'Carregando dados moleculares do PubChem...';
        if (p < 10) return 'Buscando patentes PCT via WIPO PatentScope...';
        if (p < 20) return 'Executando 36 queries no EPO OPS...';
        if (p < 40) return 'Validando resultados via Google Patents...';
        if (p < 70) return 'Buscando patentes brasileiras no INPI...';
        if (p < 82) return 'Enriquecendo metadados via INPI...';
        if (p < 90) return 'Consolidando famílias de patentes...';
        if (p < 100) return 'Calculando Patent Cliff e finalizando...';
        return 'Pronto para visualização!';
    }
    
    /**
     * Mostra progress tracker
     */
    show() {
        if (this.container) {
            this.container.classList.remove('hidden');
            this.container.style.display = 'block';
        }
    }
    
    /**
     * Esconde progress tracker
     */
    hide() {
        if (this.container) {
            this.container.classList.add('hidden');
            setTimeout(() => {
                this.container.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Salva estado em localStorage
     */
    saveState() {
        const state = {
            taskId: this.taskId,
            progress: this.currentProgress,
            stage: this.currentStage,
            timestamp: Date.now()
        };
        
        localStorage.setItem('pharmyrus_progress', JSON.stringify(state));
    }
    
    /**
     * Restaura estado de localStorage
     */
    restoreState() {
        try {
            const saved = localStorage.getItem('pharmyrus_progress');
            if (!saved) return;
            
            const state = JSON.parse(saved);
            
            // Se estado tem menos de 30 minutos, restaura
            if (Date.now() - state.timestamp < 30 * 60 * 1000) {
                this.taskId = state.taskId;
                this.currentProgress = state.progress;
                this.currentStage = state.stage;
                
                console.log('♻️  Restored progress state:', state);
                
                // Se não completou, retoma polling
                if (this.currentProgress < 100 && this.taskId) {
                    this.show();
                    this.startPolling();
                }
            } else {
                this.clearState();
            }
        } catch (error) {
            console.error('❌ Error restoring state:', error);
            this.clearState();
        }
    }
    
    /**
     * Limpa estado
     */
    clearState() {
        localStorage.removeItem('pharmyrus_progress');
    }
}

// Export para uso global
window.ProgressTracker = ProgressTracker;

console.log('✅ ProgressTracker loaded');
