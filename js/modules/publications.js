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
        this.updateDetailedStats();
        this.initialized = true;
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/publications.json');
            const jsonData = await response.json();
            this.data = jsonData.publications;
            console.log('Publications loaded:', this.data.length); // 디버깅용
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
        console.log('Grouped by type:', groupedByType); // 디버깅용
        
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
            // 연도별로 정렬
            journalAndConf.sort((a, b) => {
                if (a.year === 'working_paper') return 1;
                if (b.year === 'working_paper') return -1;
                if (a.year !== b.year) return b.year - a.year;
                return 0;
            });
            
            html += `<div class="publication-type-section mb-12">
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
        
        // Workshop과 Bridge Papers 섞어서 표시
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
            
            html += `<div class="publication-type-section mb-12">
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
        let html = `<div class="publication-type-section mb-12">
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
        // 이미 type이 정확히 지정되어 있으므로 그대로 사용
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
        const linkHtml = pub.link ? 
            `<a href="${pub.link}" target="_blank" rel="noopener noreferrer" 
                class="text-brand-teal hover:underline">[Paper]</a>` : '';
        
        // subtype 표시 (Journal/Conference/Workshop/Bridge)
        const subtypeHtml = pub.subtype ? 
            `<span class="text-xs font-medium px-2 py-0.5 rounded-full ${
                pub.subtype === 'Journal' ? 'bg-blue-100 text-blue-700' :
                pub.subtype === 'Conference' ? 'bg-green-100 text-green-700' :
                pub.subtype === 'Workshop' ? 'bg-purple-100 text-purple-700' :
                'bg-orange-100 text-orange-700'
            }">${pub.subtype}</span>` : '';
        
        return `
            <div class="publication-item p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div class="flex items-start gap-4">
                    <div class="flex-1">
                        ${subtypeHtml ? `
                        <div class="flex items-center gap-2 mb-2">
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
                        <div class="mt-3 flex items-center space-x-4 text-sm">
                            ${linkHtml}
                        </div>
                    </div>
                    ${awardHtml}
                </div>
            </div>
        `;
    },
    
    formatAuthors(authorsString) {
        return authorsString.split(',').map(author => {
            const trimmedAuthor = author.trim();
            
            // Extract symbols (*, **, †)
            const symbols = [];
            if (trimmedAuthor.includes('**')) {
                symbols.push('**');
            } else if (trimmedAuthor.includes('*')) {
                symbols.push('*');
            }
            if (trimmedAuthor.includes('†')) {
                symbols.push('†');
            }
            
            // Clean name for checking membership
            const cleanName = trimmedAuthor.replace(/[*†]/g, '').trim();
            
            // Check if lab member
            const isLabMember = this.labMembers.some(member => 
                cleanName.toLowerCase().includes(member.toLowerCase())
            );
            
            const authorClass = isLabMember ? 'text-author-pi' : 'text-author-external';
            
            // Reconstruct with symbols
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
    
    updateDetailedStats() {
        // Calculate statistics
        const stats = {
            total: this.data.length,
            byKeyword: {
                finance: 0,
                ml: 0,
                optimization: 0
            }
        };
        
        // Count by keywords
        this.data.forEach(pub => {
            if (pub.keywords && Array.isArray(pub.keywords)) {
                pub.keywords.forEach(keyword => {
                    const kw = keyword.toLowerCase();
                    if (kw.includes('finance')) stats.byKeyword.finance++;
                    if (kw.includes('machine learning') || kw.includes('deep learning')) stats.byKeyword.ml++;
                    if (kw.includes('optimization')) stats.byKeyword.optimization++;
                });
            }
        });
        
        // Update HTML elements
        const totalEl = document.getElementById('total-pubs');
        if (totalEl) {
            totalEl.textContent = stats.total;
        }
        
        const financeEl = document.getElementById('finance-pubs');
        if (financeEl) {
            financeEl.textContent = stats.byKeyword.finance;
        }
        
        const mlEl = document.getElementById('ml-pubs');
        if (mlEl) {
            mlEl.textContent = stats.byKeyword.ml;
        }
        
        const optimizationEl = document.getElementById('optimization-pubs');
        if (optimizationEl) {
            optimizationEl.textContent = stats.byKeyword.optimization;
        }
    },
    
    // Search functions remain the same...
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