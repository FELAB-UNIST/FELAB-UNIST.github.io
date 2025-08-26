// Projects Manager Module
const ProjectsManager = {
    data: [],
    initialized: false,
    currentFilter: 'all',
    
    async init() {
        if (this.initialized) return;
        
        await this.loadData();
        this.render();
        this.initSearch();
        this.initFilters();
        this.updateStatistics();
        this.initialized = true;
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/projects.json');
            const jsonData = await response.json();
            this.data = jsonData.projects;
        } catch (error) {
            console.error('Failed to load projects data:', error);
            this.data = [];
        }
    },
    
    render() {
        const container = document.getElementById('project-list');
        if (!container) return;
        
        // Group projects by status
        const groupedProjects = this.groupByStatus(this.data);
        
        let html = '';
        
        // Render ongoing projects first
        if (groupedProjects.ongoing && groupedProjects.ongoing.length > 0) {
            html += this.createStatusSection('ongoing', 'Ongoing Projects', groupedProjects.ongoing);
        }
        
        // Then completed projects
        if (groupedProjects.completed && groupedProjects.completed.length > 0) {
            html += this.createStatusSection('completed', 'Completed Projects', groupedProjects.completed);
        }
        
        container.innerHTML = html;
    },
    
    groupByStatus(projects) {
        return projects.reduce((acc, project) => {
            const status = project.status;
            if (!acc[status]) {
                acc[status] = [];
            }
            acc[status].push(project);
            return acc;
        }, {});
    },
    
    createStatusSection(status, title, projects) {
        const statusIcon = status === 'ongoing' 
            ? '<span class="w-2 h-2 bg-brand-teal rounded-full mr-3 animate-pulse"></span>'
            : '<span class="w-2 h-2 bg-gray-400 rounded-full mr-3"></span>';
            
        let html = `
            <div class="project-status-section" data-status="${status}">
                <h3 class="text-2xl font-bold text-brand-navy mb-8 flex items-center">
                    ${statusIcon}${title}
                </h3>
                <div class="grid gap-6">
        `;
        
        // Sort projects by start date (most recent first)
        projects.sort((a, b) => {
            const dateA = this.extractYear(a.duration);
            const dateB = this.extractYear(b.duration);
            return dateB - dateA;
        });
        
        projects.forEach(project => {
            html += this.createProjectHTML(project);
        });
        
        html += `</div></div>`;
        return html;
    },
    
    createProjectHTML(project) {
        const statusClass = project.status === 'ongoing' ? 'border-brand-teal' : 'border-gray-300';
        const statusBadge = project.status === 'ongoing' 
            ? '<span class="inline-flex items-center gap-1.5 bg-brand-teal text-white text-xs font-medium px-2.5 py-1 rounded-full">진행중</span>'
            : '<span class="inline-flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">✓ 완료</span>';
            
        const keywordsHtml = this.formatKeywords(project.keywords);
        
        return `
            <div class="project-item bg-white rounded-xl shadow-sm hover:shadow-lg transition-all p-6 border-l-4 ${statusClass}">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            ${statusBadge}
                            <span class="text-sm text-gray-500">${project.duration}</span>
                        </div>
                        <h4 class="text-lg font-semibold text-brand-navy mb-1 project-title-kr">
                            ${project.title_kr}
                        </h4>
                        ${project.title_en ? `
                            <p class="text-sm text-gray-600 italic project-title-en">${project.title_en}</p>
                        ` : ''}
                    </div>
                </div>
                
                <div class="space-y-2 mb-4">
                    <div class="flex items-start">
                        <span class="text-sm font-medium text-gray-700 w-20 flex-shrink-0">기관:</span>
                        <span class="text-sm text-gray-600 project-agency">${project.funding_agency}</span>
                    </div>
                    <div class="flex items-start">
                        <span class="text-sm font-medium text-gray-700 w-20 flex-shrink-0">역할:</span>
                        <span class="text-sm text-gray-600">${project.role}</span>
                    </div>
                    ${project.project_number ? `
                        <div class="flex items-start">
                            <span class="text-sm font-medium text-gray-700 w-20 flex-shrink-0">과제번호:</span>
                            <span class="text-sm text-gray-500 font-mono">${project.project_number}</span>
                        </div>
                    ` : ''}
                    ${project.notes ? `
                        <div class="flex items-start">
                            <span class="text-sm font-medium text-gray-700 w-20 flex-shrink-0">비고:</span>
                            <span class="text-sm text-gray-600">${project.notes}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${project.keywords && project.keywords.length > 0 ? `
                    <div class="flex flex-wrap gap-2">
                        ${keywordsHtml}
                    </div>
                ` : ''}
            </div>
        `;
    },
    
    formatKeywords(keywords) {
        if (!keywords) return '';
        return keywords.map(kw => 
            `<span class="keyword text-xs font-medium bg-slate-100 text-slate-800 px-2 py-1 rounded-full">
                ${kw}
            </span>`
        ).join(' ');
    },
    
    extractYear(duration) {
        const match = duration.match(/(\d{4})/);
        return match ? parseInt(match[1]) : 0;
    },
    
    initSearch() {
        const searchInput = document.getElementById('project-search');
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
    
    initFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button
                filterButtons.forEach(b => {
                    b.classList.remove('active', 'bg-brand-accent', 'text-white');
                    b.classList.add('bg-gray-200', 'text-gray-700');
                });
                btn.classList.add('active', 'bg-brand-accent', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
                
                // Apply filter
                const filterId = btn.id.replace('filter-', '');
                this.currentFilter = filterId;
                this.applyFilter();
            });
        });
    },
    
    applyFilter() {
        const sections = document.querySelectorAll('.project-status-section');
        
        sections.forEach(section => {
            const status = section.dataset.status;
            if (this.currentFilter === 'all' || this.currentFilter === status) {
                section.style.display = 'block';
            } else {
                section.style.display = 'none';
            }
        });
        
        // Clear search when filter changes
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.clearHighlights();
    },
    
    performSearch(query) {
        const projectItems = document.querySelectorAll('.project-item');
        const sections = document.querySelectorAll('.project-status-section');
        
        this.clearHighlights();
        
        if (!query) {
            // Show all items when search is empty and apply current filter
            projectItems.forEach(item => {
                item.style.display = 'block';
            });
            this.applyFilter();
            return;
        }
        
        let hasVisibleItems = false;
        
        projectItems.forEach(item => {
            const titleKr = item.querySelector('.project-title-kr')?.textContent?.toLowerCase() || '';
            const titleEn = item.querySelector('.project-title-en')?.textContent?.toLowerCase() || '';
            const agency = item.querySelector('.project-agency')?.textContent?.toLowerCase() || '';
            const keywords = Array.from(item.querySelectorAll('.keyword')).map(k => k.textContent.toLowerCase()).join(' ');
            
            const searchableText = `${titleKr} ${titleEn} ${agency} ${keywords}`;
            
            if (searchableText.includes(query)) {
                item.style.display = 'block';
                this.highlightText(item, query);
                hasVisibleItems = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show/hide sections based on visible items
        sections.forEach(section => {
            const visibleItems = section.querySelectorAll('.project-item[style*="display: block"], .project-item:not([style*="display: none"])');
            section.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
        
        this.toggleNoResultsMessage(!hasVisibleItems);
    },
    
    highlightText(item, query) {
        const titleElement = item.querySelector('.project-title-kr');
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
                    <div class="text-4xl mb-4">📋</div>
                    <p class="text-lg font-semibold mb-2">No projects found</p>
                    <p class="text-sm">Try different keywords or check your spelling</p>
                `;
                document.getElementById('project-list').appendChild(noResultsEl);
            }
            noResultsEl.style.display = 'block';
        } else if (noResultsEl) {
            noResultsEl.style.display = 'none';
        }
    },
    
    updateStatistics() {
        const total = this.data.length;
        const ongoing = this.data.filter(p => p.status === 'ongoing').length;
        const completed = this.data.filter(p => p.status === 'completed').length;
        const agencies = new Set(this.data.map(p => p.funding_agency)).size;
        
        document.getElementById('total-projects').textContent = total;
        document.getElementById('ongoing-projects').textContent = ongoing;
        document.getElementById('completed-projects').textContent = completed;
        document.getElementById('funding-agencies').textContent = agencies;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectsManager;
}