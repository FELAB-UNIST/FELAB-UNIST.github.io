// Publications Manager Module
const PublicationsManager = {
    data: [],
    initialized: false,
    
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
            // Fallback to empty array if load fails
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
                        <p class="font-semibold text-brand-navy text-lg">${pub.title}</p>
                        <p class="text-sm mt-1">${authorsHtml}</p>
                        <p class="text-sm text-gray-500 italic mt-1">${pub.venue}</p>
                        ${pub.keywords.length > 0 ? 
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
            let authorClass = 'text-author-external';
            if (trimmedAuthor.endsWith('*') || trimmedAuthor.endsWith('†')) {
                authorClass = 'text-author-pi';
            }
            return `<span class="${authorClass}">${trimmedAuthor.replace(/[*†]/g, '')}</span>`;
        }).join(', ');
    },
    
    formatKeywords(keywords) {
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
        
        searchInput.addEventListener('keyup', (e) => {
            const query = e.target.value.toLowerCase();
            this.filterPublications(query);
        });
    },
    
    filterPublications(query) {
        const publicationItems = document.querySelectorAll('.publication-item');
        const yearSections = document.querySelectorAll('.publication-year-section');
        
        publicationItems.forEach(item => {
            const textContent = item.textContent.toLowerCase();
            if (textContent.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
        
        // Hide year sections that have no visible publications
        yearSections.forEach(section => {
            const visibleItems = section.querySelectorAll('.publication-item[style="display: block"], .publication-item:not([style])');
            if (query && visibleItems.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = 'block';
            }
        });
    }
};