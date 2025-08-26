// Publications Manager Module
const PublicationsManager = {
    data: [],
    initialized: false,
    
    // Lab members and affiliates list for proper author classification
    labMembers: [
        'Yongjae Lee', 'Hoyoung Lee', 'Junhyeong Lee', 'Inwoo Tae', 'Juchan Kim', 'Kangmin Kim',
        'Yejin Kim', 'Seonmi Kim', 'Seyoung Kim', 'Youngbin Lee', 'Sohyeon Kwon', 'Minjoo Choi',
        'Yoontae Hwang', 'Joohwan Hong', 'Hyungwoo Kong'
    ],
    
    async init() {
        if (this.initialized) return;
        
        await this.loadData();
        this.render();
        this.initSearch();
        this.initialized = true;
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/publications.json');
            const jsonData = await response.json();
            this.data = jsonData.publications;
        } catch (error) {
            console.error('Failed to load publications data:', error);
            this.data = [];
        }
    },
    
    render() {
        const container = document.getElementById('publication-list');
        if (!container) return;
        
        // Group publications by year
        const groupedByYear = this.groupByYear(this.data);
        
        let html = '';
        const sortedYears = this.getSortedYears(groupedByYear);
        
        sortedYears.forEach(year => {
            const sectionTitle = year === 'working_paper' ? 'Submitted & Working Papers' : year;
            html += `<div class="publication-year-section">
                <h3 class="font-bold text-xl text-brand-navy">${sectionTitle}</h3>
                <div class="space-y-6 mt-4">`;
            
            groupedByYear[year].forEach(pub => {
                html += this.createPublicationHTML(pub);
            });
            
            html += `</div></div>`;
        });
        
        container.innerHTML = html;
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
        
        return `
            <div class="publication-item p-4 rounded-lg hover:bg-gray-50">
                <div class="flex items-start gap-4">
                    <div class="flex-1">
                        <p class="font-semibold text-brand-navy text-lg pub-title">${pub.title}</p>
                        <p class="text-sm mt-1 pub-authors">${authorsHtml}</p>
                        <p class="text-sm text-gray-500 italic mt-1 pub-venue">${pub.venue}</p>
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
    
    getSearchableText(pub) {
        const cleanAuthors = pub.authors.replace(/[*†]/g, '').toLowerCase();
        const cleanKeywords = pub.keywords ? pub.keywords.join(' ').toLowerCase() : '';
        return `${pub.title.toLowerCase()} ${cleanAuthors} ${pub.venue.toLowerCase()} ${cleanKeywords}`;
    },
    
    formatAuthors(authorsString) {
        return authorsString.split(',').map(author => {
            const trimmedAuthor = author.trim();
            const cleanName = trimmedAuthor.replace(/[*†]/g, '').trim();
            
            // Simple check for lab members
            const isLabMember = this.labMembers.some(member => 
                cleanName.toLowerCase().includes(member.toLowerCase()) || 
                trimmedAuthor.includes('*') || 
                trimmedAuthor.includes('†')
            );
            
            const authorClass = isLabMember ? 'text-author-pi' : 'text-author-external';
            return `<span class="${authorClass}">${cleanName}</span>`;
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
        if (notes && notes.toLowerCase().includes('best poster award')) {
            return `
                <div class="flex-shrink-0">
                    <span class="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
                        <svg class="w-3 h-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M9 2a.75.75 0 01.75.75v1.25a.75.75 0 01-1.5 0V2.75A.75.75 0 019 2zM10.75 18a.75.75 0 01.75-.75h1.25a.75.75 0 010 1.5H11.5a.75.75 0 01-.75-.75zM2 9.75A.75.75 0 012.75 9h1.25a.75.75 0 010 1.5H2.75A.75.75 0 012 9.75zM15 11.75a.75.75 0 01.75-.75h1.25a.75.75 0 010 1.5H15.75a.75.75 0 01-.75-.75zM4.094 15.906a.75.75 0 010-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 01-1.06 0zM14.846 6.154a.75.75 0 010-1.06l.884-.884a.75.75 0 111.06 1.06l-.884.884a.75.75 0 01-1.06 0zM15.906 15.906a.75.75 0 01-1.06 0l-.884-.884a.75.75 0 111.06-1.06l.884.884a.75.75 0 010 1.06zM5.154 6.154a.75.75 0 01-1.06 0l-.884-.884a.75.75 0 111.06-1.06l.884.884a.75.75 0 010 1.06zM10 4a6 6 0 100 12 6 6 0 000-12z" clip-rule="evenodd" />
                        </svg>
                        Best Poster Award
                    </span>
                </div>
            `;
        }
        return '';
    },
    
    initSearch() {
        const searchInput = document.getElementById('publication-search');
        if (!searchInput) return;
        
        let searchTimeout;
        
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                const query = e.target.value.toLowerCase().trim();
                this.performSearch(query);
            }, 200); // Reduced timeout
        });
    },
    
    performSearch(query) {
        const publicationItems = document.querySelectorAll('.publication-item');
        const yearSections = document.querySelectorAll('.publication-year-section');
        
        // Clear previous highlights
        this.clearHighlights();
        
        if (!query) {
            // Show all items when search is empty
            publicationItems.forEach(item => {
                item.style.display = 'block';
                item.classList.remove('highlight-match');
            });
            yearSections.forEach(section => section.style.display = 'block');
            this.toggleNoResultsMessage(false);
            return;
        }
        
        let hasVisibleItems = false;
        
        publicationItems.forEach(item => {
            // Get text content directly from DOM elements
            const title = item.querySelector('.pub-title')?.textContent?.toLowerCase() || '';
            const authors = item.querySelector('.pub-authors')?.textContent?.toLowerCase() || '';
            const venue = item.querySelector('.pub-venue')?.textContent?.toLowerCase() || '';
            const keywords = Array.from(item.querySelectorAll('.keyword')).map(k => k.textContent.toLowerCase()).join(' ');
            
            const searchableText = `${title} ${authors} ${venue} ${keywords}`;
            
            // Debug log
            console.log('Searching for:', query, 'in:', searchableText.substring(0, 100) + '...');
            
            // Simple substring search
            if (searchableText.includes(query)) {
                item.style.display = 'block';
                item.classList.add('highlight-match');
                this.highlightText(item, query);
                hasVisibleItems = true;
                console.log('Match found!', title.substring(0, 50));
            } else {
                item.style.display = 'none';
                item.classList.remove('highlight-match');
            }
        });
        
        console.log('Total visible items:', hasVisibleItems);
        
        // Show/hide year sections
        yearSections.forEach(section => {
            const visibleItems = section.querySelectorAll('.publication-item[style*="display: block"], .publication-item:not([style*="display: none"])');
            console.log('Section visible items:', visibleItems.length);
            section.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
        
        this.toggleNoResultsMessage(!hasVisibleItems);
    },
    
    highlightText(item, query) {
        // Simple highlighting for title only
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