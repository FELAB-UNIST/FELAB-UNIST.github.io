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
        this.initialized = false;
        
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
                cleanName.toLowerCase().includes(member.toLowerCase())
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
    },
    
    updateStatistics() {
        // Calculate statistics
        const stats = this.calculateStatistics();
        
        // Update main counts
        const totalEl = document.getElementById('total-publications');
        const journalEl = document.getElementById('journal-papers');
        const conferenceEl = document.getElementById('conference-papers');
        const workingEl = document.getElementById('working-papers');
        
        if (totalEl) totalEl.textContent = stats.total;
        if (journalEl) journalEl.textContent = stats.journals;
        if (conferenceEl) conferenceEl.textContent = stats.conferences;
        if (workingEl) workingEl.textContent = stats.workingPapers;
        
        // Update year distribution
        this.updateYearDistribution(stats.yearDistribution);
        
        // Update top venues
        this.updateTopVenues(stats.topJournals, stats.topConferences);
        
        // Update keyword cloud
        this.updateKeywordCloud(stats.keywordFrequency);
    },
    
    calculateStatistics() {
        const stats = {
            total: 0,
            journals: 0,
            conferences: 0,
            workingPapers: 0,
            yearDistribution: {},
            venues: {},
            keywords: {},
            topJournals: [],
            topConferences: []
        };
        
        this.data.forEach(pub => {
            // Count total
            stats.total++;
            
            // Count by type
            if (pub.year === 'working_paper') {
                stats.workingPapers++;
            } else if (pub.venue && pub.venue.toLowerCase().includes('conference')) {
                stats.conferences++;
            } else if (pub.venue && (pub.venue.toLowerCase().includes('journal') || 
                                     pub.venue.toLowerCase().includes('letters') ||
                                     pub.venue.toLowerCase().includes('annals'))) {
                stats.journals++;
            } else if (pub.venue && (pub.venue.toLowerCase().includes('aaai') || 
                                     pub.venue.toLowerCase().includes('icaif') ||
                                     pub.venue.toLowerCase().includes('aistats') ||
                                     pub.venue.toLowerCase().includes('pakdd') ||
                                     pub.venue.toLowerCase().includes('cikm') ||
                                     pub.venue.toLowerCase().includes('iclr'))) {
                stats.conferences++;
            } else {
                // Default to journal if not clear
                stats.journals++;
            }
            
            // Count by year
            if (pub.year !== 'working_paper') {
                stats.yearDistribution[pub.year] = (stats.yearDistribution[pub.year] || 0) + 1;
            }
            
            // Count venues (excluding working papers)
            if (pub.venue && pub.year !== 'working_paper') {
                const cleanVenue = pub.venue.split('(')[0].trim();
                stats.venues[cleanVenue] = (stats.venues[cleanVenue] || 0) + 1;
            }
            
            // Count keywords
            if (pub.keywords && Array.isArray(pub.keywords)) {
                pub.keywords.forEach(keyword => {
                    stats.keywords[keyword] = (stats.keywords[keyword] || 0) + 1;
                });
            }
        });
        
        // Get top venues
        const sortedVenues = Object.entries(stats.venues)
            .sort((a, b) => b[1] - a[1]);
        
        // Separate journals and conferences
        sortedVenues.forEach(([venue, count]) => {
            if (venue.toLowerCase().includes('journal') || 
                venue.toLowerCase().includes('letters') ||
                venue.toLowerCase().includes('annals') ||
                venue.toLowerCase().includes('quantitative finance') ||
                venue.toLowerCase().includes('operations research') ||
                venue.toLowerCase().includes('applied economics') ||
                venue.toLowerCase().includes('sustainability') ||
                venue.toLowerCase().includes('ieee access')) {
                stats.topJournals.push({ venue, count });
            } else {
                stats.topConferences.push({ venue, count });
            }
        });
        
        // Limit to top 5
        stats.topJournals = stats.topJournals.slice(0, 5);
        stats.topConferences = stats.topConferences.slice(0, 5);
        
        // Calculate keyword frequency
        stats.keywordFrequency = Object.entries(stats.keywords)
            .sort((a, b) => b[1] - a[1]);
        
        return stats;
    },
    
    updateYearDistribution(yearDist) {
        const container = document.getElementById('year-distribution');
        if (!container) return;
        
        const sortedYears = Object.entries(yearDist)
            .sort((a, b) => b[0] - a[0])
            .slice(0, 10); // Show last 10 years
        
        container.innerHTML = sortedYears.map(([year, count]) => `
            <div class="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <span class="text-sm font-semibold text-gray-700">${year}:</span>
                <span class="text-sm text-brand-accent font-bold">${count}</span>
            </div>
        `).join('');
    },
    
    updateTopVenues(topJournals, topConferences) {
        // Update journals
        const journalsContainer = document.getElementById('top-journals');
        if (journalsContainer) {
            if (topJournals.length > 0) {
                journalsContainer.innerHTML = topJournals.map((item, index) => `
                    <div class="flex items-center justify-between py-2 ${index < topJournals.length - 1 ? 'border-b' : ''}">
                        <span class="text-sm text-gray-700 flex-1 pr-2">${item.venue}</span>
                        <span class="text-sm font-semibold text-blue-600">${item.count}</span>
                    </div>
                `).join('');
            } else {
                journalsContainer.innerHTML = '<p class="text-sm text-gray-500">No journal data available</p>';
            }
        }
        
        // Update conferences
        const conferencesContainer = document.getElementById('top-conferences');
        if (conferencesContainer) {
            if (topConferences.length > 0) {
                conferencesContainer.innerHTML = topConferences.map((item, index) => `
                    <div class="flex items-center justify-between py-2 ${index < topConferences.length - 1 ? 'border-b' : ''}">
                        <span class="text-sm text-gray-700 flex-1 pr-2">${item.venue}</span>
                        <span class="text-sm font-semibold text-purple-600">${item.count}</span>
                    </div>
                `).join('');
            } else {
                conferencesContainer.innerHTML = '<p class="text-sm text-gray-500">No conference data available</p>';
            }
        }
    },
    
    updateKeywordCloud(keywords) {
        const container = document.getElementById('keyword-cloud');
        if (!container) return;
        
        // Define size classes based on frequency
        const getSizeClass = (count, max) => {
            const ratio = count / max;
            if (ratio > 0.7) return 'text-lg font-bold';
            if (ratio > 0.4) return 'text-base font-semibold';
            return 'text-sm';
        };
        
        const getColorClass = (keyword) => {
            if (keyword.toLowerCase().includes('finance')) return 'text-brand-accent';
            if (keyword.toLowerCase().includes('machine learning')) return 'text-purple-600';
            if (keyword.toLowerCase().includes('optimization')) return 'text-blue-600';
            return 'text-gray-700';
        };
        
        const maxCount = keywords.length > 0 ? keywords[0][1] : 1;
        
        container.innerHTML = keywords.slice(0, 15).map(([keyword, count]) => `
            <span class="px-3 py-1 bg-gray-50 rounded-full ${getSizeClass(count, maxCount)} ${getColorClass(keyword)}">
                ${keyword} (${count})
            </span>
        `).join('');
    }
};