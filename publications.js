// Publications Manager Module
const PublicationsManager = {
    data: [],
    initialized: false,
    
    // Lab members and affiliates list for proper author classification
    labMembers: [
        'Yongjae Lee', 'Hoyoung Lee', 'Junhyeong Lee', 'Inwoo Tae', 'Juchan Kim', 'Kangmin Kim',
        'Yejin Kim', 'Seonmi Kim', 'Seyoung Kim', 'Youngbin Lee', 'Sohyeon Kwon', 'Minjoo Choi',
        'Yoontae Hwang', 'Joohwan Hong', 'Hyungwoo Kong', 'Suhwan Park'
    ],
    
    async init() {
        this.initialized = false;
        
        await this.loadData();
        this.render();
        this.initSearch();
        this.initCiteModal();
        this.updateDetailedStats();
        this.initialized = true;
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/publications.json');
            const jsonData = await response.json();
            this.data = jsonData.publications;
            console.log('Publications loaded:', this.data.length);
        } catch (error) {
            console.error('Failed to load publications data:', error);
            this.data = [];
        }
    },
    
    render() {
        const container = document.getElementById('publication-list');
        if (!container) return;
        
        // Group publications by type
        const groupedByType = this.groupByType(this.data);
        console.log('Grouped by type:', groupedByType);
        
        let html = '';
        
        // Book in Progress 먼저
        if (groupedByType['Book in Progress']) {
            html += this.renderTypeSection('Book in Progress', groupedByType['Book in Progress']);
        }
        
        // Journal과 Conference를 섞어서 표시
        const journalAndConf = [];
        if (groupedByType['Journal']) {
            journalAndConf.push(...groupedByType['Journal'].map(p => ({...p, subtype: 'Journal'})));
        }
        if (groupedByType['Conference']) {
            journalAndConf.push(...groupedByType['Conference'].map(p => ({...p, subtype: 'Conference'})));
        }
        
        if (journalAndConf.length > 0) {
            journalAndConf.sort((a, b) => {
                if (a.year === 'working_paper') return 1;
                if (b.year === 'working_paper') return -1;
                if (a.year !== b.year) return b.year - a.year;
                return 0;
            });
            
            html += `<div id="section-journal-conference" class="publication-type-section mb-12">
                <h2 class="text-2xl font-bold text-brand-navy mb-6 pb-2 border-b-2 border-brand-accent">
                    Journal & Conference Papers (${journalAndConf.length})
                </h2>`;
            
            const groupedByYear = this.groupByYear(journalAndConf);
            const sortedYears = this.getSortedYears(groupedByYear);
            
            sortedYears.forEach(year => {
                html += `<div class="publication-year-section mb-8">
                    <h3 class="font-semibold text-lg text-gray-700 mb-4">${year}</h3>
                    <div class="space-y-4">`;
                
                groupedByYear[year].forEach(pub => {
                    html += this.createPublicationHTML(pub);
                });
                
                html += `</div></div>`;
            });
            
            html += `</div>`;
        }
        
        // Workshop과 Bridge Papers
        const workshopAndBridge = [];
        if (groupedByType['Conference Workshop']) {
            workshopAndBridge.push(...groupedByType['Conference Workshop'].map(p => ({...p, subtype: 'Workshop'})));
        }
        if (groupedByType['Bridge Paper']) {
            workshopAndBridge.push(...groupedByType['Bridge Paper'].map(p => ({...p, subtype: 'Bridge'})));
        }
        
        if (workshopAndBridge.length > 0) {
            workshopAndBridge.sort((a, b) => {
                if (a.year === 'working_paper') return 1;
                if (b.year === 'working_paper') return -1;
                if (a.year !== b.year) return b.year - a.year;
                return 0;
            });
            
            html += `<div id="section-workshop" class="publication-type-section mb-12">
                <h2 class="text-2xl font-bold text-brand-navy mb-6 pb-2 border-b-2 border-brand-accent">
                    Conference Workshop & Bridge Papers (${workshopAndBridge.length})
                </h2>`;
            
            const groupedByYear = this.groupByYear(workshopAndBridge);
            const sortedYears = this.getSortedYears(groupedByYear);
            
            sortedYears.forEach(year => {
                html += `<div class="publication-year-section mb-8">
                    <h3 class="font-semibold text-lg text-gray-700 mb-4">${year}</h3>
                    <div class="space-y-4">`;
                
                groupedByYear[year].forEach(pub => {
                    html += this.createPublicationHTML(pub);
                });
                
                html += `</div></div>`;
            });
            
            html += `</div>`;
        }
        
        // Non-Refereed Papers
        if (groupedByType['Non-Refereed Papers']) {
            html += this.renderTypeSection('Non-Refereed Papers', groupedByType['Non-Refereed Papers']);
        }
        
        // Working Papers
        if (groupedByType['Working Papers']) {
            html += this.renderTypeSection('Working Papers', groupedByType['Working Papers']);
        }
        
        container.innerHTML = html;
    },
    
    renderTypeSection(type, publications) {
        const sectionId = type === 'Non-Refereed Papers' ? 'section-non-refereed' : 
                          type === 'Working Papers' ? 'section-working' : 
                          type === 'Book in Progress' ? 'section-book' : '';
        
        let html = `<div id="${sectionId}" class="publication-type-section mb-12">
            <h2 class="text-2xl font-bold text-brand-navy mb-6 pb-2 border-b-2 border-brand-accent">
                ${type} (${publications.length})
            </h2>`;
        
        const groupedByYear = this.groupByYear(publications);
        const sortedYears = this.getSortedYears(groupedByYear);
        
        sortedYears.forEach(year => {
            const yearTitle = year === 'working_paper' ? 'In Progress' : year;
            html += `<div class="publication-year-section mb-8">
                <h3 class="font-semibold text-lg text-gray-700 mb-4">${yearTitle}</h3>
                <div class="space-y-4">`;
            
            groupedByYear[year].forEach(pub => {
                html += this.createPublicationHTML(pub);
            });
            
            html += `</div></div>`;
        });
        
        html += `</div>`;
        return html;
    },
    
    groupByType(publications) {
        return publications.reduce((acc, pub) => {
            const type = pub.type;
            if (!acc[type]) {
                acc[type] = [];
            }
            acc[type].push(pub);
            return acc;
        }, {});
    },
    
    groupByYear(publications) {
        return publications.reduce((acc, pub) => {
            const year = pub.year;
            if (!acc[year]) {
                acc[year] = [];
            }
            acc[year].push(pub);
            return acc;
        }, {});
    },
    
    getSortedYears(groupedByYear) {
        return Object.keys(groupedByYear).sort((a, b) => {
            if (a === 'working_paper') return 1;
            if (b === 'working_paper') return -1;
            return b - a;
        });
    },
    
    createPublicationHTML(pub) {
        const authorsHtml = this.formatAuthors(pub.authors);
        const keywordsHtml = this.formatKeywords(pub.keywords);
        const awardHtml = this.formatAward(pub.notes);
        const oralHtml = this.formatOral(pub.notes);
        
        // Links
        const linkHtml = pub.link ? 
            `<a href="${pub.link}" target="_blank" rel="noopener noreferrer" 
                class="inline-flex items-center gap-1 text-brand-teal hover:underline">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Paper</a>` : '';
        
        const githubHtml = pub.github ? 
            `<a href="${pub.github}" target="_blank" rel="noopener noreferrer" 
                class="inline-flex items-center gap-1 text-gray-700 hover:text-gray-900 hover:underline">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub</a>` : '';
        
        // Cite button (only if citation data exists)
        const citation = pub.citation || {};
        const hasCitation = citation.apa || citation.bibtex;
        const citeHtml = hasCitation ? 
            `<button onclick="PublicationsManager.openCiteModal('${pub.id}')" 
                class="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 hover:underline">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
                Cite</button>` : '';
        
        // Google Scholar link
        const scholarHtml = citation.scholar_url ? 
            `<a href="${citation.scholar_url}" target="_blank" rel="noopener noreferrer" 
                class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
                </svg>
                Scholar</a>` : '';
        
        // subtype 표시
        const subtypeHtml = pub.subtype ? 
            `<span class="text-xs font-medium px-2 py-0.5 rounded-full ${
                pub.subtype === 'Journal' ? 'bg-blue-100 text-blue-700' :
                pub.subtype === 'Conference' ? 'bg-green-100 text-green-700' :
                pub.subtype === 'Workshop' ? 'bg-purple-100 text-purple-700' :
                'bg-orange-100 text-orange-700'
            }">${pub.subtype}</span>` : '';
        
        // Right side badges
        const rightBadgesHtml = (awardHtml || oralHtml) ? `
            <div class="flex-shrink-0 flex flex-col gap-2">
                ${awardHtml}
                ${oralHtml}
            </div>
        ` : '';
        
        return `
            <div class="publication-item p-4 rounded-lg hover:bg-gray-50 transition-colors" data-pub-id="${pub.id}">
                <div class="flex items-start gap-4">
                    <div class="flex-1">
                        ${subtypeHtml ? `
                        <div class="flex items-center gap-2 mb-2 flex-wrap">
                            ${subtypeHtml}
                            <p class="font-semibold text-brand-navy text-lg pub-title flex-1">${pub.title}</p>
                        </div>` : `
                        <p class="font-semibold text-brand-navy text-lg pub-title mb-2">${pub.title}</p>`}
                        <p class="text-sm mt-1 pub-authors">${authorsHtml}</p>
                        <p class="text-sm text-gray-500 italic mt-1 pub-venue">${pub.venue || ''}</p>
                        ${pub.keywords && pub.keywords.length > 0 ? 
                            `<div class="mt-3 flex flex-wrap gap-2">${keywordsHtml}</div>` : ''}
                        ${pub.notes ? 
                            `<p class="text-sm text-gray-600 mt-2">${pub.notes}</p>` : ''}
                        <div class="mt-3 flex items-center flex-wrap gap-4 text-sm">
                            ${linkHtml}
                            ${githubHtml}
                            ${citeHtml}
                            ${scholarHtml}
                        </div>
                    </div>
                    ${rightBadgesHtml}
                </div>
            </div>
        `;
    },
    
    formatAuthors(authorsString) {
        return authorsString.split(',').map(author => {
            const trimmedAuthor = author.trim();
            
            const symbols = [];
            if (trimmedAuthor.includes('**')) {
                symbols.push('**');
            } else if (trimmedAuthor.includes('*')) {
                symbols.push('*');
            }
            if (trimmedAuthor.includes('†')) {
                symbols.push('†');
            }
            
            const cleanName = trimmedAuthor.replace(/[*†]/g, '').trim();
            
            const isLabMember = this.labMembers.some(member => 
                cleanName.toLowerCase().includes(member.toLowerCase())
            );
            
            const authorClass = isLabMember ? 'text-author-pi' : 'text-author-external';
            
            const symbolsHtml = symbols.length > 0 ? 
                `<sup class="text-xs">${symbols.join('')}</sup>` : '';
            
            return `<span class="${authorClass}">${cleanName}${symbolsHtml}</span>`;
        }).join(', ');
    },
    
    formatKeywords(keywords) {
        if (!keywords) return '';
        return keywords.map(kw => 
            `<span class="keyword text-xs font-medium bg-slate-100 text-slate-800 px-2 py-1 rounded-full">
                ${kw}
            </span>`
        ).join(' ');
    },
    
    formatAward(notes) {
        if (notes && notes.toLowerCase().includes('best') && notes.toLowerCase().includes('award')) {
            return `
                <div class="flex-shrink-0">
                    <span class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Award
                    </span>
                </div>
            `;
        }
        return '';
    },
    
    formatOral(notes) {
        if (notes && notes.toLowerCase().includes('oral')) {
            return `
                <span class="inline-flex items-center gap-1.5 bg-rose-100 text-rose-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Oral
                </span>
            `;
        }
        return '';
    },
    
    updateDetailedStats() {
        const groupedByType = this.groupByType(this.data);
        
        const journalConfCount = (groupedByType['Journal']?.length || 0) + 
                                 (groupedByType['Conference']?.length || 0);
        const workshopCount = (groupedByType['Conference Workshop']?.length || 0) + 
                              (groupedByType['Bridge Paper']?.length || 0);
        const nonRefereedCount = groupedByType['Non-Refereed Papers']?.length || 0;
        const workingCount = groupedByType['Working Papers']?.length || 0;
        
        const totalEl = document.getElementById('total-pubs');
        if (totalEl) totalEl.textContent = this.data.length;
        
        const journalConfEl = document.getElementById('journal-conf-pubs');
        if (journalConfEl) journalConfEl.textContent = journalConfCount;
        
        const workshopEl = document.getElementById('workshop-pubs');
        if (workshopEl) workshopEl.textContent = workshopCount;
        
        const nonRefereedEl = document.getElementById('non-refereed-pubs');
        if (nonRefereedEl) nonRefereedEl.textContent = nonRefereedCount;
        
        const workingEl = document.getElementById('working-pubs');
        if (workingEl) workingEl.textContent = workingCount;
    },
    
    scrollToSection(sectionName) {
        const sectionId = `section-${sectionName}`;
        const section = document.getElementById(sectionId);
        if (section) {
            const headerOffset = 100;
            const elementPosition = section.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },
    
    // ==================== Citation Modal ====================
    
    initCiteModal() {
        // Modal이 없으면 생성
        if (!document.getElementById('cite-modal')) {
            const modalHtml = `
                <div id="cite-modal" class="fixed inset-0 z-50 hidden">
                    <div class="fixed inset-0 bg-black bg-opacity-50" onclick="PublicationsManager.closeCiteModal()"></div>
                    <div class="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden pointer-events-auto">
                            <div class="flex items-center justify-between px-6 py-4 border-b">
                                <h3 class="text-lg font-semibold text-gray-900">Cite this paper</h3>
                                <button onclick="PublicationsManager.closeCiteModal()" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="px-6 py-4">
                                <!-- Tabs -->
                                <div class="flex gap-2 mb-4">
                                    <button id="cite-tab-apa" onclick="PublicationsManager.switchCiteTab('apa')" 
                                        class="px-4 py-2 text-sm font-medium rounded-lg bg-brand-navy text-white">
                                        APA
                                    </button>
                                    <button id="cite-tab-bibtex" onclick="PublicationsManager.switchCiteTab('bibtex')" 
                                        class="px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
                                        BibTeX
                                    </button>
                                </div>
                                <!-- Content -->
                                <div id="cite-content-apa" class="cite-content">
                                    <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto" id="cite-apa-text"></div>
                                </div>
                                <div id="cite-content-bibtex" class="cite-content hidden">
                                    <div class="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto" id="cite-bibtex-text"></div>
                                </div>
                                <!-- Copy Button -->
                                <button onclick="PublicationsManager.copyCitation()" 
                                    class="mt-4 w-full py-2 px-4 bg-brand-teal text-white rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                    </svg>
                                    <span id="copy-btn-text">Copy to Clipboard</span>
                                </button>
                            </div>
                            <!-- Footer with Scholar link -->
                            <div id="cite-modal-footer" class="px-6 py-3 bg-gray-50 border-t text-center hidden">
                                <a id="cite-scholar-link" href="#" target="_blank" rel="noopener noreferrer" 
                                    class="text-sm text-gray-600 hover:text-blue-600 inline-flex items-center gap-1">
                                    Looking for other versions?
                                    <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z"/>
                                    </svg>
                                    Google Scholar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    },
    
    currentCiteTab: 'apa',
    currentPubId: null,
    
    openCiteModal(pubId) {
        const pub = this.data.find(p => p.id === pubId);
        if (!pub || !pub.citation) return;
        
        this.currentPubId = pubId;
        this.currentCiteTab = 'apa';
        
        const modal = document.getElementById('cite-modal');
        const apaText = document.getElementById('cite-apa-text');
        const bibtexText = document.getElementById('cite-bibtex-text');
        const footer = document.getElementById('cite-modal-footer');
        const scholarLink = document.getElementById('cite-scholar-link');
        
        apaText.textContent = pub.citation.apa || 'APA citation not available';
        bibtexText.textContent = pub.citation.bibtex || 'BibTeX citation not available';
        
        // Scholar link
        if (pub.citation.scholar_url) {
            scholarLink.href = pub.citation.scholar_url;
            footer.classList.remove('hidden');
        } else {
            footer.classList.add('hidden');
        }
        
        // Reset tabs
        this.switchCiteTab('apa');
        
        // Show modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },
    
    closeCiteModal() {
        const modal = document.getElementById('cite-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
        document.getElementById('copy-btn-text').textContent = 'Copy to Clipboard';
    },
    
    switchCiteTab(tab) {
        this.currentCiteTab = tab;
        
        const apaTab = document.getElementById('cite-tab-apa');
        const bibtexTab = document.getElementById('cite-tab-bibtex');
        const apaContent = document.getElementById('cite-content-apa');
        const bibtexContent = document.getElementById('cite-content-bibtex');
        
        if (tab === 'apa') {
            apaTab.className = 'px-4 py-2 text-sm font-medium rounded-lg bg-brand-navy text-white';
            bibtexTab.className = 'px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300';
            apaContent.classList.remove('hidden');
            bibtexContent.classList.add('hidden');
        } else {
            bibtexTab.className = 'px-4 py-2 text-sm font-medium rounded-lg bg-brand-navy text-white';
            apaTab.className = 'px-4 py-2 text-sm font-medium rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300';
            bibtexContent.classList.remove('hidden');
            apaContent.classList.add('hidden');
        }
        
        document.getElementById('copy-btn-text').textContent = 'Copy to Clipboard';
    },
    
    async copyCitation() {
        const pub = this.data.find(p => p.id === this.currentPubId);
        if (!pub || !pub.citation) return;
        
        const text = this.currentCiteTab === 'apa' ? pub.citation.apa : pub.citation.bibtex;
        
        if (!text) return;
        
        try {
            await navigator.clipboard.writeText(text);
            document.getElementById('copy-btn-text').textContent = 'Copied!';
            setTimeout(() => {
                document.getElementById('copy-btn-text').textContent = 'Copy to Clipboard';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            document.getElementById('copy-btn-text').textContent = 'Copied!';
        }
    },
    
    // ==================== Search ====================
    
    initSearch() {
        const searchInput = document.getElementById('publication-search');
        if (!searchInput) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();
                this.performSearch(query);
            }, 200);
        });
    },
    
    performSearch(query) {
        const publicationItems = document.querySelectorAll('.publication-item');
        const typeSections = document.querySelectorAll('.publication-type-section');
        const yearSections = document.querySelectorAll('.publication-year-section');
        
        this.clearHighlights();
        
        if (!query) {
            publicationItems.forEach(item => {
                item.style.display = 'block';
                item.classList.remove('highlight-match');
            });
            typeSections.forEach(section => section.style.display = 'block');
            yearSections.forEach(section => section.style.display = 'block');
            this.toggleNoResultsMessage(false);
            return;
        }
        
        let hasVisibleItems = false;
        
        publicationItems.forEach(item => {
            const title = item.querySelector('.pub-title')?.textContent?.toLowerCase() || '';
            const authors = item.querySelector('.pub-authors')?.textContent?.toLowerCase() || '';
            const venue = item.querySelector('.pub-venue')?.textContent?.toLowerCase() || '';
            const keywords = Array.from(item.querySelectorAll('.keyword')).map(k => k.textContent.toLowerCase()).join(' ');
            
            const searchableText = `${title} ${authors} ${venue} ${keywords}`;
            
            if (searchableText.includes(query)) {
                item.style.display = 'block';
                item.classList.add('highlight-match');
                this.highlightText(item, query);
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
                item.classList.remove('highlight-match');
            }
        });
        
        typeSections.forEach(section => {
            const visibleItems = section.querySelectorAll('.publication-item[style*="display: block"], .publication-item:not([style*="display: none"])');
            section.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
        
        yearSections.forEach(section => {
            const visibleItems = section.querySelectorAll('.publication-item[style*="display: block"], .publication-item:not([style*="display: none"])');
            section.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
        
        this.toggleNoResultsMessage(!hasVisibleItems);
    },
    
    highlightText(item, query) {
        const titleElement = item.querySelector('.pub-title');
        if (titleElement) {
            const text = titleElement.textContent;
            const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
            if (regex.test(text)) {
                titleElement.innerHTML = text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
            }
        }
    },
    
    clearHighlights() {
        document.querySelectorAll('mark').forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    },
    
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    toggleNoResultsMessage(show) {
        let noResultsEl = document.getElementById('no-results-message');
        
        if (show) {
            if (!noResultsEl) {
                noResultsEl = document.createElement('div');
                noResultsEl.id = 'no-results-message';
                noResultsEl.className = 'text-center py-12 text-gray-500';
                noResultsEl.innerHTML = `
                    <div class="text-4xl mb-4">📄</div>
                    <p class="text-lg font-semibold mb-2">No publications found</p>
                    <p class="text-sm">Try different keywords or check your spelling</p>
                `;
                document.getElementById('publication-list').appendChild(noResultsEl);
            }
            noResultsEl.style.display = 'block';
        } else if (noResultsEl) {
            noResultsEl.style.display = 'none';
        }
    }
};
