// Publications Manager Module
const PublicationsManager = {
    data: [],
    initialized: false,
    
    // Lab members and affiliates list for proper author classification
    labMembers: [
        'Yongjae Lee', 'Hoyoung Lee', 'Junhyeong Lee', 'Inwoo Tae', 'Juchan Kim', 'Kangmin Kim',
        'Yejin Kim', 'Seonmi Kim', 'Seyoung Kim', 'Youngbin Lee', 'Sohyeon Kwon', 'Minjoo Choi',
        'Yoontae Hwang', 'Joohwan Hong', 'Hyeongwoo Kong', 'Suhwan Park', 'Sangjin Jin'
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
            this.data = jsonData.publications.map((pub, index) => ({
                ...pub,
                _originalIndex: index
            }));
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
        
        const conferenceAndJournal = [];
        if (groupedByType['Conference']) {
            conferenceAndJournal.push(...groupedByType['Conference'].map(p => ({...p, subtype: 'Conference'})));
        }
        if (groupedByType['Journal']) {
            conferenceAndJournal.push(...groupedByType['Journal'].map(p => ({...p, subtype: 'Journal'})));
        }

        if (conferenceAndJournal.length > 0) {
            html += this.renderCombinedTypeSection(
                'conference-journal',
                'Conference & Journal Papers',
                conferenceAndJournal
            );
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
                
                const sortedPublications = groupedByYear[year]
                    .slice()
                    .sort((a, b) => this.comparePublicationsWithinYear(a, b));
                
                sortedPublications.forEach(pub => {
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
        // ID용 slug 생성
        const sectionId = type === 'Non-Refereed Papers' ? 'section-non-refereed' : 
                          type === 'Working Papers' ? 'section-working' : 
                          type === 'Book in Progress' ? 'section-book' :
                          type === 'Journal' ? 'section-journal' :
                          type === 'Conference' ? 'section-conference' : '';
        const sectionTitle = type === 'Journal' ? 'Journal Papers' :
                             type === 'Conference' ? 'Conference Papers' :
                             type;
        
        let html = `<div id="${sectionId}" class="publication-type-section mb-12">
            <h2 class="text-2xl font-bold text-brand-navy mb-6 pb-2 border-b-2 border-brand-accent">
                ${sectionTitle} (${publications.length})
            </h2>`;
        
        const groupedByYear = this.groupByYear(publications);
        const sortedYears = this.getSortedYears(groupedByYear);
        
        sortedYears.forEach(year => {
            const yearTitle = year === 'working_paper' ? 'In Progress' : year;
            html += `<div class="publication-year-section mb-8">
                <h3 class="font-semibold text-lg text-gray-700 mb-4">${yearTitle}</h3>
                <div class="space-y-4">`;
            
            const sortedPublications = groupedByYear[year]
                .slice()
                .sort((a, b) => this.comparePublicationsWithinYear(a, b));
            
            sortedPublications.forEach(pub => {
                html += this.createPublicationHTML(pub);
            });
            
            html += `</div></div>`;
        });
        
        html += `</div>`;
        return html;
    },

    renderCombinedTypeSection(sectionName, sectionTitle, publications) {
        const sectionId = `section-${sectionName}`;
        let html = `<div id="${sectionId}" class="publication-type-section mb-12">
            <h2 class="text-2xl font-bold text-brand-navy mb-6 pb-2 border-b-2 border-brand-accent">
                ${sectionTitle} (${publications.length})
            </h2>`;

        const groupedByYear = this.groupByYear(publications);
        const sortedYears = this.getSortedYears(groupedByYear);

        sortedYears.forEach(year => {
            const sortedPublications = groupedByYear[year].slice().sort((a, b) => {
                const priority = { Conference: 0, Journal: 1 };
                const aPriority = Object.prototype.hasOwnProperty.call(priority, a.subtype) ? priority[a.subtype] : 2;
                const bPriority = Object.prototype.hasOwnProperty.call(priority, b.subtype) ? priority[b.subtype] : 2;
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                return this.comparePublicationsWithinYear(a, b);
            });

            html += `<div class="publication-year-section mb-8">
                <h3 class="font-semibold text-lg text-gray-700 mb-4">${year}</h3>
                <div class="space-y-4">`;

            sortedPublications.forEach(pub => {
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

    comparePublicationsWithinYear(a, b) {
        const aDate = this.getEventDateValue(a);
        const bDate = this.getEventDateValue(b);
        const aHasDate = Number.isFinite(aDate);
        const bHasDate = Number.isFinite(bDate);
        
        if (aHasDate && bHasDate && aDate !== bDate) {
            return bDate - aDate;
        }

        if (aHasDate !== bHasDate) {
            return aHasDate ? -1 : 1;
        }
        
        return (a._originalIndex || 0) - (b._originalIndex || 0);
    },

    getEventDateValue(pub) {
        if (!pub.event_date) {
            return Number.POSITIVE_INFINITY;
        }
        
        const timestamp = Date.parse(`${pub.event_date}T00:00:00Z`);
        return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
    },
    
    createPublicationHTML(pub) {
        const authorsHtml = this.formatAuthors(pub.authors);
        const keywordsHtml = this.formatKeywords(pub.keywords);
        const awardHtml = this.formatAward(pub.notes);
        const oralHtml = this.formatOral(pub.notes);
        
        // Links
        const linkHtml = pub.link ? 
            `<a href="${pub.link}" target="_blank" rel="noopener noreferrer" 
                class="text-brand-teal hover:underline">[Paper]</a>` : '';
        
        const githubHtml = pub.github ? 
            `<a href="${pub.github}" target="_blank" rel="noopener noreferrer" 
                class="text-gray-700 hover:text-gray-900 hover:underline">[GitHub]</a>` : '';
        
        // Cite button (only if citation data exists)
        const citation = pub.citation || {};
        const hasCitation = citation.apa || citation.bibtex;
        const citeHtml = hasCitation ? 
            `<button onclick="PublicationsManager.openCiteModal('${pub.id}')" 
                class="text-purple-600 hover:text-purple-800 hover:underline cursor-pointer">[Cite]</button>` : '';
        
        // Version link (Google Scholar)
        const versionHtml = citation.scholar_url ? 
            `<a href="${citation.scholar_url}" target="_blank" rel="noopener noreferrer" 
                class="text-blue-600 hover:text-blue-800 hover:underline">[Versions]</a>` : '';
        
        // subtype 표시 (Journal/Conference/Workshop/Bridge)
        const subtypeHtml = pub.subtype ? 
            `<span class="text-xs font-medium px-2 py-0.5 rounded-full ${
                pub.subtype === 'Journal' ? 'bg-blue-100 text-blue-700' :
                pub.subtype === 'Conference' ? 'bg-green-100 text-green-700' :
                pub.subtype === 'Workshop' ? 'bg-purple-100 text-purple-700' :
                'bg-orange-100 text-orange-700'
            }">${pub.subtype}</span>` : '';
        
        // Right side badges (award and oral)
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
                        <div class="mt-3 flex items-center space-x-3 text-sm">
                            ${linkHtml}
                            ${githubHtml}
                            ${citeHtml}
                            ${versionHtml}
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
        
        // Count by category
        const journalCount = (groupedByType['Journal'] && groupedByType['Journal'].length) || 0;
        const conferenceCount = (groupedByType['Conference'] && groupedByType['Conference'].length) || 0;
        const workshopCount = ((groupedByType['Conference Workshop'] && groupedByType['Conference Workshop'].length) || 0) +
                              ((groupedByType['Bridge Paper'] && groupedByType['Bridge Paper'].length) || 0);
        const nonRefereedCount = (groupedByType['Non-Refereed Papers'] && groupedByType['Non-Refereed Papers'].length) || 0;
        const workingCount = (groupedByType['Working Papers'] && groupedByType['Working Papers'].length) || 0;
        
        // Update HTML elements
        const totalEl = document.getElementById('total-pubs');
        if (totalEl) totalEl.textContent = this.data.length;
        
        const journalEl = document.getElementById('journal-pubs');
        if (journalEl) journalEl.textContent = journalCount;
        
        const conferenceEl = document.getElementById('conference-pubs');
        if (conferenceEl) conferenceEl.textContent = conferenceCount;
        
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
            const headerOffset = 100; // sticky header 높이 고려
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
                                <h3 class="text-lg font-semibold text-gray-900">Cite</h3>
                                <button onclick="PublicationsManager.closeCiteModal()" class="text-gray-400 hover:text-gray-600">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                            <div class="px-6 py-4 max-h-[60vh] overflow-y-auto">
                                <!-- APA Section -->
                                <div class="mb-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium text-gray-700">APA</span>
                                        <button onclick="PublicationsManager.copyAPA()" 
                                            class="text-xs text-brand-teal hover:underline" id="copy-apa-btn">
                                            Copy
                                        </button>
                                    </div>
                                    <div id="cite-apa-text" 
                                        class="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 cursor-pointer hover:bg-gray-100 transition-colors"
                                        onclick="PublicationsManager.copyAPA()">
                                    </div>
                                </div>
                                
                                <!-- BibTeX Section -->
                                <div>
                                    <div class="flex items-center justify-between mb-2">
                                        <span class="text-sm font-medium text-gray-700">BibTeX</span>
                                        <button onclick="PublicationsManager.copyBibTeX()" 
                                            class="text-xs text-brand-teal hover:underline" id="copy-bibtex-btn">
                                            Copy
                                        </button>
                                    </div>
                                    <pre id="cite-bibtex-text" 
                                        class="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 cursor-pointer hover:bg-gray-100 transition-colors font-mono whitespace-pre-wrap overflow-x-auto"
                                        onclick="PublicationsManager.copyBibTeX()"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHtml);
        }
    },
    
    currentPubId: null,
    
    openCiteModal(pubId) {
        const pub = this.data.find(p => p.id === pubId);
        if (!pub || !pub.citation) return;
        
        this.currentPubId = pubId;
        
        const modal = document.getElementById('cite-modal');
        const apaText = document.getElementById('cite-apa-text');
        const bibtexText = document.getElementById('cite-bibtex-text');
        
        apaText.textContent = pub.citation.apa || 'APA citation not available';
        bibtexText.textContent = pub.citation.bibtex || 'BibTeX citation not available';
        
        // Reset copy buttons
        document.getElementById('copy-apa-btn').textContent = 'Copy';
        document.getElementById('copy-bibtex-btn').textContent = 'Copy';
        
        // Show modal
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },
    
    closeCiteModal() {
        const modal = document.getElementById('cite-modal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    },
    
    async copyAPA() {
        const pub = this.data.find(p => p.id === this.currentPubId);
        if (!pub || !pub.citation || !pub.citation.apa) return;
        
        await this.copyToClipboard(pub.citation.apa, 'copy-apa-btn');
    },
    
    async copyBibTeX() {
        const pub = this.data.find(p => p.id === this.currentPubId);
        if (!pub || !pub.citation || !pub.citation.bibtex) return;
        
        await this.copyToClipboard(pub.citation.bibtex, 'copy-bibtex-btn');
    },
    
    async copyToClipboard(text, buttonId) {
        try {
            await navigator.clipboard.writeText(text);
            const btn = document.getElementById(buttonId);
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = 'Copy';
            }, 1000);
        } catch (err) {
            console.error('Failed to copy:', err);
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            const btn = document.getElementById(buttonId);
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = 'Copy';
            }, 1000);
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
            const titleElement = item.querySelector('.pub-title');
            const authorsElement = item.querySelector('.pub-authors');
            const venueElement = item.querySelector('.pub-venue');
            const title = titleElement && titleElement.textContent ? titleElement.textContent.toLowerCase() : '';
            const authors = authorsElement && authorsElement.textContent ? authorsElement.textContent.toLowerCase() : '';
            const venue = venueElement && venueElement.textContent ? venueElement.textContent.toLowerCase() : '';
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
