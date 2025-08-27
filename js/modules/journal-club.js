// Journal Club Manager Module - Fixed Version
const JournalClubManager = {
    data: [],
    filteredData: [],
    initialized: false,
    currentTopic: 'all',
    currentPage: 1,
    itemsPerPage: 20,
    searchQuery: '',
    
    async init() {
        if (this.initialized) return;
        
        console.log('Initializing Journal Club Manager...');
        try {
            await this.loadData();
            this.render();
            this.initSearch();
            this.initFilters();
            this.updateStatistics();
            this.initialized = true;
            console.log('Journal Club Manager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Journal Club Manager:', error);
            this.showError();
        }
    },
    
    async loadData() {
        try {
            console.log('Loading journal club data...');
            const response = await fetch('./data/journal-club.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const jsonData = await response.json();
            console.log('Raw data loaded:', jsonData);
            
            // Transform the data to match our structure
            this.data = jsonData.map((item, index) => ({
                id: `jc${String(index + 1).padStart(3, '0')}`,
                date: this.parseDate(item.date),
                title: item.title,
                presenter: item.presenter,
                topic: this.extractTopic(item.title, item.reason),
                keywords: this.extractKeywords(item.title, item.reason),
                paper_link: item.url,
                why: item.reason,
                status: 'discussed'
            }));
            
            // Sort by date (newest first)
            this.data.sort((a, b) => new Date(b.date) - new Date(a.date));
            this.filteredData = [...this.data];
            
            console.log(`Successfully loaded ${this.data.length} papers`);
        } catch (error) {
            console.error('Failed to load journal club data:', error);
            // Fallback to sample data for demo
            this.loadSampleData();
        }
    },
    
    loadSampleData() {
        console.log('Loading sample data as fallback...');
        const sampleData = [
            {
                "date": "2025년 08월 21일",
                "title": "Retrieval augmented diffusion models for time series forecasting",
                "presenter": "Juchan Kim",
                "reason": "Retrieval + Time series forecasting 컨셉을 가져왔지만 백본으로 디퓨전 모델을 사용했다는 점에서 신기해서 가져와봤습니다.",
                "url": "https://arxiv.org/abs/2410.18712"
            },
            {
                "date": "2025년 08월 21일",
                "title": "mKG-RAG: Multimodal Knowledge Graph-Enhanced RAG for Visual Question Answering",
                "presenter": "Inwoo Tae",
                "reason": "위 논문은 멀티모달 정보가 혼재된 환경에서 보다 신뢰성 있는 RAG를 구현하기 위해 멀티모달 Knowledge Graph 기반 RAG 프레임워크를 제안합니다.",
                "url": "https://www.arxiv.org/pdf/2508.05318"
            },
            {
                "date": "2025년 08월 12일",
                "title": "TRACE: Grounding Time Series in Context for Multimodal Embedding and Retrieval",
                "presenter": "Junhyeong Lee",
                "reason": "시계열에서의 Multimodal retreival 연구입니다. Time series forecasting이 LLMs을 이용하도록 많이 연구되면서 Times series retrieval system까지 나타나게 되었습니다.",
                "url": "https://arxiv.org/pdf/2506.09114"
            }
        ];
        
        // Transform the sample data
        this.data = sampleData.map((item, index) => ({
            id: `jc${String(index + 1).padStart(3, '0')}`,
            date: this.parseDate(item.date),
            title: item.title,
            presenter: item.presenter,
            topic: this.extractTopic(item.title, item.reason),
            keywords: this.extractKeywords(item.title, item.reason),
            paper_link: item.url,
            why: item.reason,
            status: 'discussed'
        }));
        
        // Sort by date (newest first)
        this.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.filteredData = [...this.data];
    },
    
    showError() {
        const containers = ['recent-papers-grid', 'papers-table-container'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `
                    <div class="text-center py-8 text-red-500">
                        <div class="text-4xl mb-4">⚠️</div>
                        <p class="text-lg font-semibold mb-2">Failed to load journal club data</p>
                        <p class="text-sm">Please check if the data file exists and is properly formatted</p>
                    </div>
                `;
            }
        });
    },
    
    parseDate(dateString) {
        try {
            // Parse Korean date format "2025년 08월 21일" to ISO format
            const match = dateString.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
            if (match) {
                const year = match[1];
                const month = String(match[2]).padStart(2, '0');
                const day = String(match[3]).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
            
            // If it's already in ISO format or another standard format, try to parse it
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            
            // Fallback to today's date
            return new Date().toISOString().split('T')[0];
        } catch (error) {
            console.warn('Failed to parse date:', dateString, error);
            return new Date().toISOString().split('T')[0];
        }
    },
    
    extractTopic(title, reasonText = '') {
        const topics = {
            'Time Series': ['time series', 'forecasting', '시계열', '예측', 'temporal', 'TRACE'],
            'Deep Learning': ['deep learning', 'neural', 'diffusion', '딥러닝', '신경망', 'transformer'],
            'NLP & AI': ['RAG', 'retrieval', 'LLM', 'language model', 'question answering', 'multimodal', 'LLMs'],
            'Knowledge Graph': ['knowledge graph', 'KG', '지식 그래프', 'mKG-RAG'],
            'Machine Learning': ['machine learning', 'ML', '머신러닝', 'embedding'],
            'Computer Vision': ['visual', 'image', '이미지', '시각'],
            'Optimization': ['optimization', '최적화'],
            'Finance': ['financial', 'portfolio', '금융', '포트폴리오']
        };
        
        const searchText = (title + ' ' + (reasonText || '')).toLowerCase();
        
        for (const [topic, keywords] of Object.entries(topics)) {
            if (keywords.some(keyword => searchText.includes(keyword.toLowerCase()))) {
                return topic;
            }
        }
        
        return 'General';
    },
    
    extractKeywords(title, reasonText = '') {
        const keywords = [];
        const text = (title + ' ' + (reasonText || '')).toLowerCase();
        
        const keywordPatterns = [
            'diffusion', 'retrieval', 'time series', 'forecasting', 'rag',
            'multimodal', 'knowledge graph', 'neural network', 'transformer',
            'deep learning', 'machine learning', 'llm', 'embedding', 'visual'
        ];
        
        keywordPatterns.forEach(pattern => {
            if (text.includes(pattern)) {
                keywords.push(pattern);
            }
        });
        
        return keywords;
    },
    
    render() {
        this.renderRecentPapers();
        this.renderTopicFilters();
        this.renderPapersTable();
    },
    
    renderRecentPapers() {
        const container = document.getElementById('recent-papers-grid');
        if (!container) return;
        
        // Get the 6 most recent papers
        const recentPapers = this.data.slice(0, 6);
        
        if (recentPapers.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <p>No recent papers available</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        recentPapers.forEach(paper => {
            html += `
                <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-all group">
                    <div class="flex justify-between items-start mb-3">
                        <span class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            ${this.formatDate(paper.date)}
                        </span>
                    </div>
                    <h4 class="font-semibold text-brand-navy mb-3 group-hover:text-brand-accent transition-colors leading-snug">
                        ${paper.title}
                    </h4>
                    <div class="mt-4 flex items-center justify-between">
                        <p class="text-sm text-gray-500">
                            Presenter: <span class="font-medium">${paper.presenter}</span>
                        </p>
                        ${paper.paper_link ? `
                            <a href="${paper.paper_link}" target="_blank" rel="noopener noreferrer" 
                               class="text-brand-accent hover:underline text-sm font-medium">
                                Paper →
                            </a>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    renderTopicFilters() {
        // Topic filters are no longer needed, so this function can be empty
        // or we can remove the filter container from the HTML
        const container = document.getElementById('topic-filters');
        if (container) {
            container.style.display = 'none';
        }
    },
    
    renderPapersTable() {
        const container = document.getElementById('papers-table-container');
        if (!container) return;
        
        // Calculate pagination
        const startIdx = (this.currentPage - 1) * this.itemsPerPage;
        const endIdx = startIdx + this.itemsPerPage;
        const paginatedData = this.filteredData.slice(startIdx, endIdx);
        
        if (this.filteredData.length === 0) {
            container.innerHTML = `
                <div class="text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📄</div>
                    <p class="text-lg font-semibold mb-2">No papers found</p>
                    <p class="text-sm">Try different search terms</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32">
                                Date
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                Paper Title
                            </th>
                            <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-36">
                                Presenter
                            </th>
                            <th class="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider w-20">
                                Link
                            </th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">
        `;
        
        paginatedData.forEach(paper => {
            html += `
                <tr class="hover:bg-gray-50 transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 w-32">
                        ${this.formatDate(paper.date)}
                    </td>
                    <td class="px-6 py-4">
                        <p class="text-sm font-medium text-brand-navy paper-title">
                            ${this.highlightSearch(paper.title)}
                        </p>
                        ${paper.why ? `
                            <p class="text-xs text-gray-500 mt-2 line-clamp-3">
                                ${this.truncateText(paper.why, 150)}
                            </p>
                        ` : ''}
                    </td>
                    <td class="px-6 py-4 text-sm text-gray-600 paper-presenter w-36">
                        ${this.highlightSearch(paper.presenter)}
                    </td>
                    <td class="px-6 py-4 text-center w-20">
                        ${paper.paper_link ? `
                            <a href="${paper.paper_link}" target="_blank" rel="noopener noreferrer" 
                               class="text-brand-accent hover:underline text-sm font-medium">
                                <svg class="w-5 h-5 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        ` : '<span class="text-gray-400">-</span>'}
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        // Add pagination controls
        html += this.renderPaginationControls();
        
        container.innerHTML = html;
    },
    
    renderPaginationControls() {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        
        if (totalPages <= 1) return '';
        
        let html = `
            <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
                <div class="text-sm text-gray-700">
                    <span class="font-medium">${((this.currentPage - 1) * this.itemsPerPage) + 1}</span>
                    -
                    <span class="font-medium">${Math.min(this.currentPage * this.itemsPerPage, this.filteredData.length)}</span>
                    of
                    <span class="font-medium">${this.filteredData.length}</span> results
                </div>
                <div class="flex space-x-2">
        `;
        
        // Previous button
        html += `
            <button onclick="JournalClubManager.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''} 
                    class="px-3 py-1 text-sm border rounded ${this.currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                Previous
            </button>
        `;
        
        // Page numbers (simplified for better performance)
        const maxVisible = 5;
        const startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        const endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <button onclick="JournalClubManager.goToPage(${i})" 
                        class="px-3 py-1 text-sm border rounded ${i === this.currentPage ? 'bg-brand-accent text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        html += `
            <button onclick="JournalClubManager.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''} 
                    class="px-3 py-1 text-sm border rounded ${this.currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'}">
                Next
            </button>
        `;
        
        html += `
                </div>
            </div>
        `;
        
        return html;
    },
    
    initSearch() {
        const searchInput = document.getElementById('journal-search');
        if (!searchInput) return;
        
        let searchTimeout;
        
        // Remove existing event listeners
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        newSearchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.performSearch();
            }, 300);
        });
    },
    
    initFilters() {
        // This method is called from render functions
    },
    
    performSearch() {
        if (!this.searchQuery) {
            this.applyFilters();
            return;
        }
        
        this.filteredData = this.data.filter(paper => {
            const searchableText = `
                ${paper.title.toLowerCase()}
                ${paper.presenter.toLowerCase()}
                ${paper.topic.toLowerCase()}
                ${paper.keywords.join(' ').toLowerCase()}
                ${(paper.why || '').toLowerCase()}
            `;
            return searchableText.includes(this.searchQuery);
        });
        
        // Apply topic filter on top of search
        if (this.currentTopic !== 'all') {
            this.filteredData = this.filteredData.filter(p => p.topic === this.currentTopic);
        }
        
        this.currentPage = 1;
        this.renderPapersTable();
    },
    
    filterByTopic(topic) {
        this.currentTopic = topic;
        this.applyFilters();
        this.renderTopicFilters();
    },
    
    applyFilters() {
        if (this.currentTopic === 'all') {
            this.filteredData = [...this.data];
        } else {
            this.filteredData = this.data.filter(p => p.topic === this.currentTopic);
        }
        
        // Apply search on top of topic filter
        if (this.searchQuery) {
            this.performSearch();
        } else {
            this.currentPage = 1;
            this.renderPapersTable();
        }
    },
    
    goToPage(page) {
        const totalPages = Math.ceil(this.filteredData.length / this.itemsPerPage);
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.renderPapersTable();
        
        // Scroll to top of table
        const tableSection = document.getElementById('papers-table-section');
        if (tableSection) {
            tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    },
    
    // Utility functions
    truncateTitle(title) {
        if (!title) return 'No title available';
        if (title.length > 80) {
            return title.substring(0, 77) + '...';
        }
        return title;
    },
    
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    },
    
    highlightSearch(text) {
        if (!this.searchQuery || !text) return text;
        
        const regex = new RegExp(`(${this.escapeRegExp(this.searchQuery)})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    },
    
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    },
    
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}.${month}.${day}`;
        } catch (error) {
            return dateString;
        }
    },
    
    getTopicColor(topic) {
        const colors = {
            'Time Series': 'bg-blue-100 text-blue-800',
            'Deep Learning': 'bg-purple-100 text-purple-800',
            'NLP & AI': 'bg-green-100 text-green-800',
            'Knowledge Graph': 'bg-indigo-100 text-indigo-800',
            'Machine Learning': 'bg-orange-100 text-orange-800',
            'Computer Vision': 'bg-pink-100 text-pink-800',
            'Optimization': 'bg-yellow-100 text-yellow-800',
            'Finance': 'bg-teal-100 text-teal-800',
            'General': 'bg-gray-100 text-gray-800'
        };
        return colors[topic] || 'bg-gray-100 text-gray-800';
    },
    
    updateStatistics() {
        const statsContainer = document.getElementById('journal-stats');
        if (!statsContainer) return;
        
        const totalPapers = this.data.length;
        const uniquePresenters = new Set(this.data.map(p => p.presenter)).size;
        const uniqueTopics = new Set(this.data.map(p => p.topic)).size;
        
        // Get current year papers count
        const currentYear = new Date().getFullYear();
        const thisYearPapers = this.data.filter(p => {
            const year = new Date(p.date).getFullYear();
            return year === currentYear;
        }).length;
        
        statsContainer.innerHTML = `
            <div class="bg-white p-4 rounded-lg">
                <div class="text-2xl font-bold text-brand-accent">${totalPapers}</div>
                <div class="text-sm text-gray-600">Total Papers</div>
            </div>
            <div class="bg-white p-4 rounded-lg">
                <div class="text-2xl font-bold text-brand-navy">${uniquePresenters}</div>
                <div class="text-sm text-gray-600">Presenters</div>
            </div>
            <div class="bg-white p-4 rounded-lg">
                <div class="text-2xl font-bold text-brand-teal">${uniqueTopics}</div>
                <div class="text-sm text-gray-600">Research Areas</div>
            </div>
            <div class="bg-white p-4 rounded-lg">
                <div class="text-2xl font-bold text-gray-600">${thisYearPapers}</div>
                <div class="text-sm text-gray-600">This Year</div>
            </div>
        `;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JournalClubManager;
}