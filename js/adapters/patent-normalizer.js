/**
 * Patent Data Normalizer
 * =====================
 * 
 * Camada de normalização entre backend JSON e UI Model
 * Garante backward compatibility e forward compatibility
 * 
 * PRINCÍPIO: O front NÃO se adapta ao JSON. O JSON é normalizado para o front.
 */

class PatentNormalizer {
    /**
     * Normaliza a resposta completa do backend
     * @param {Object} rawData - JSON bruto do backend
     * @returns {Object} - Modelo normalizado para UI
     */
    static normalizeAnalysis(rawData) {
        console.log('🔄 Normalizing analysis data...');
        
        // Detectar versão do JSON
        const version = this.detectVersion(rawData);
        console.log(`📌 Detected JSON version: ${version}`);
        
        if (version === 'v31+') {
            return this.normalizeV31(rawData);
        } else if (version === 'v27') {
            return this.normalizeV27(rawData);
        } else {
            console.warn('⚠️  Unknown JSON version, attempting v31 normalization');
            return this.normalizeV31(rawData);
        }
    }
    
    /**
     * Detecta a versão do JSON
     */
    static detectVersion(data) {
        if (data.metadata && data.patent_discovery) {
            return 'v31+';
        }
        if (data.search_result && data.executive_summary) {
            return 'v27';
        }
        return 'unknown';
    }
    
    /**
     * Normaliza JSON v31+ (novo backend)
     */
    static normalizeV31(data) {
        const normalized = {
            // Metadata
            metadata: {
                search_id: data.metadata?.search_id || `search_${Date.now()}`,
                molecule_name: data.metadata?.molecule_name || '',
                brand_name: data.metadata?.brand_name || '',
                search_date: data.metadata?.search_date || new Date().toISOString(),
                elapsed_seconds: data.metadata?.elapsed_seconds || 0,
                version: data.metadata?.version || 'v31.0',
                target_countries: data.metadata?.target_countries || ['BR'],
                sources_used: data.metadata?.sources_used || {}
            },
            
            // Summary (compatível com UI existente)
            summary: {
                total_wo_patents: data.patent_discovery?.summary?.total_wo_patents || 0,
                total_patents: data.patent_discovery?.summary?.total_patents || 0,
                by_country: data.patent_discovery?.summary?.by_country || {},
                by_source: data.patent_discovery?.summary?.by_source || {},
                
                // Novos campos v31+
                wipo_wos: data.patent_discovery?.summary?.wipo_wos || 0,
                epo_wos: data.patent_discovery?.summary?.epo_wos || 0,
                google_wos: data.patent_discovery?.summary?.google_wos || 0,
                inpi_direct_brs: data.patent_discovery?.summary?.inpi_direct_brs || 0
            },
            
            // Patent Cliff
            patent_cliff: {
                first_expiration: data.patent_discovery?.patent_cliff?.first_expiration || null,
                last_expiration: data.patent_discovery?.patent_cliff?.last_expiration || null,
                years_until_cliff: data.patent_discovery?.patent_cliff?.years_until_cliff || null,
                status: data.patent_discovery?.patent_cliff?.status || 'Unknown',
                by_country: data.patent_discovery?.patent_cliff?.by_country || {},
                all_expirations: data.patent_discovery?.patent_cliff?.all_expirations || []
            },
            
            // Patents (unificado)
            patents: this.extractAllPatents(data),
            
            // Patent Families
            patent_families: data.patent_discovery?.patent_families || [],
            
            // Research & Development (NOVO!)
            research_and_development: data.research_and_development || {
                molecular_data: {},
                clinical_trials: { count: 0, trials: [] },
                regulatory_data: {},
                literature: { count: 0, publications: [] }
            },
            
            // Search Qualifiers (NOVO!)
            search_qualifiers: this.extractSearchQualifiers(data)
        };
        
        console.log(`✅ Normalized: ${normalized.patents.length} patents, ${normalized.patent_families.length} families`);
        return normalized;
    }
    
    /**
     * Normaliza JSON v27 (legacy)
     */
    static normalizeV27(data) {
        console.log('📦 Normalizing legacy v27 format');
        
        const patents = data.search_result?.patents || [];
        
        const normalized = {
            metadata: {
                search_id: `legacy_${Date.now()}`,
                molecule_name: data.search_result?.molecule || '',
                brand_name: '',
                search_date: data.generated_at || new Date().toISOString(),
                elapsed_seconds: 0,
                version: 'v27-legacy',
                target_countries: ['BR'],
                sources_used: {}
            },
            
            summary: {
                total_wo_patents: data.search_result?.total_families || 0,
                total_patents: patents.length,
                by_country: { 'BR': patents.length },
                by_source: { 'Legacy': patents.length },
                wipo_wos: 0,
                epo_wos: 0,
                google_wos: 0,
                inpi_direct_brs: 0
            },
            
            patent_cliff: {
                first_expiration: null,
                last_expiration: null,
                years_until_cliff: null,
                status: 'Unknown',
                by_country: {},
                all_expirations: []
            },
            
            patents: patents.map(p => this.normalizeV27Patent(p)),
            
            patent_families: data.search_result?.families || [],
            
            research_and_development: {
                molecular_data: {},
                clinical_trials: { count: 0, trials: [] },
                regulatory_data: {},
                literature: { count: 0, publications: [] }
            },
            
            search_qualifiers: {
                molecule: data.search_result?.molecule || '',
                dev_codes: [],
                cas_number: null,
                countries: ['BR']
            }
        };
        
        console.log(`✅ Legacy normalized: ${normalized.patents.length} patents`);
        return normalized;
    }
    
    /**
     * Extrai todas as patentes do JSON v31+
     */
    static extractAllPatents(data) {
        const patents = [];
        
        // 1. Patentes por país
        if (data.patent_discovery?.patents_by_country) {
            for (const [country, countryPatents] of Object.entries(data.patent_discovery.patents_by_country)) {
                patents.push(...countryPatents.map(p => ({...p, _source: 'by_country'})));
            }
        }
        
        // 2. All patents (fallback)
        if (data.patent_discovery?.all_patents) {
            patents.push(...data.patent_discovery.all_patents.map(p => ({...p, _source: 'all_patents'})));
        }
        
        // 3. Extrair de families
        if (data.patent_discovery?.patent_families) {
            data.patent_discovery.patent_families.forEach(family => {
                if (family.national_patents) {
                    for (const [country, countryPatents] of Object.entries(family.national_patents)) {
                        patents.push(...countryPatents.map(p => ({
                            ...p, 
                            _source: 'family',
                            _wo_number: family.wo_number
                        })));
                    }
                }
            });
        }
        
        // Deduplicar por patent_number
        const unique = new Map();
        patents.forEach(p => {
            if (p.patent_number && !unique.has(p.patent_number)) {
                unique.set(p.patent_number, p);
            }
        });
        
        return Array.from(unique.values());
    }
    
    /**
     * Normaliza patente v27 para formato v31+
     */
    static normalizeV27Patent(patent) {
        return {
            patent_number: patent.patent_id || patent.publication_number || 'UNKNOWN',
            country: patent.jurisdiction || 'BR',
            title: patent.title || 'N/A',
            abstract: patent.abstract || null,
            applicants: patent.assignees || [],
            inventors: patent.inventors || [],
            filing_date: patent.filing_date || null,
            publication_date: patent.publication_date || null,
            priority_date: patent.priority_date || null,
            legal_status: patent.legal_status || 'Unknown',
            ipc_codes: patent.ipc_classifications || [],
            source: patent.source || 'Legacy',
            sources: [patent.source || 'Legacy'],
            link_espacenet: patent.source_url || null,
            link_google_patents: patent.source_url || null,
            _source: 'legacy'
        };
    }
    
    /**
     * Extrai qualificadores de busca
     */
    static extractSearchQualifiers(data) {
        const rd = data.research_and_development?.molecular_data || {};
        
        return {
            molecule: data.metadata?.molecule_name || '',
            dev_codes: rd.development_codes || [],
            cas_number: rd.cas_number || null,
            synonyms: rd.synonyms || [],
            countries: data.metadata?.target_countries || [],
            sources: Object.entries(data.metadata?.sources_used || {})
                .filter(([k, v]) => v === true)
                .map(([k]) => k)
        };
    }
    
    /**
     * Normaliza progresso do backend para UI
     */
    static normalizeProgress(progressData) {
        return {
            percentage: progressData.percentage || 0,
            stage: progressData.stage || 'initializing',
            message: progressData.message || 'Processando...',
            stage_label: this.getStageLabel(progressData.percentage || 0)
        };
    }
    
    /**
     * Mapeia percentual para label de estágio
     */
    static getStageLabel(percentage) {
        if (percentage < 5) return 'Inicializando...';
        if (percentage < 10) return 'Buscando WIPO PCT...';
        if (percentage < 20) return 'Buscando EPO OPS...';
        if (percentage < 40) return 'Validando via Google Patents...';
        if (percentage < 70) return 'Buscando INPI Brasil...';
        if (percentage < 82) return 'Enriquecendo dados INPI...';
        if (percentage < 90) return 'Consolidando famílias...';
        if (percentage < 100) return 'Finalizando análise...';
        return 'Análise completa!';
    }
}

// Export para uso global
window.PatentNormalizer = PatentNormalizer;

console.log('✅ PatentNormalizer loaded');
