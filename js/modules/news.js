// News Manager Module
const NewsManager = {
    data: null,
    initialized: false,
    currentFilter: 'all',
    currentNewsId: null,
    
    async init() {
        if (this.initialized) return;
        
        await this.loadData();
        this.render();
        this.initFilters();
        this.bindEvents();
        this.initialized = true;
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/news.json');
            const jsonData = await response.json();
            this.data = jsonData;
            console.log(`Loaded ${this.data.news.length} news items`);
        } catch (error) {
            console.error('Failed to load news data:', error);
            this.data = { news: [], categories: {} };
        }
    },
    
    render() {
        this.renderFilters();
        this.renderFeaturedNews();
        this.renderRecentNews();
        this.renderNewsArchive();
    },
    
    renderFilters() {
        const filterContainer = document.getElementById('news-filters');
        if (!filterContainer) return;
        
        const categories = Object.entries(this.data.categories);
        
        // Count items per category
        const categoryCounts = {};
        this.data.news.forEach(news => {
            categoryCounts[news.category] = (categoryCounts[news.category] || 0) + 1;
        });
        
        // Filter out categories with 0 items
        const activeCategories = categories.filter(([key, cat]) => categoryCounts[key] > 0);
        
        filterContainer.innerHTML = `
            <button onclick="NewsManager.filterByCategory('all')" 
                    data-category="all"
                    class="filter-btn active px-4 py-2 text-sm font-medium bg-brand-accent text-white rounded-lg shadow-md">
                All (${this.data.news.length})
            </button>
            ${activeCategories.map(([key, cat]) => `
                <button onclick="NewsManager.filterByCategory('${key}')" 
                        data-category="${key}"
                        class="filter-btn px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    ${cat.name} (${categoryCounts[key]})
                </button>
            `).join('')}
        `;
    },
    
    renderFeaturedNews() {
        // Find the most recent featured news
        const featured = this.data.news
            .filter(n => n.featured)
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        
        if (!featured) {
            // If no featured news, show the most recent news as featured
            const mostRecent = this.data.news
                .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
            if (mostRecent) {
                this.renderFeaturedCard(mostRecent);
            }
            return;
        }
        
        this.renderFeaturedCard(featured);
    },
    
    renderFeaturedCard(news) {
        const container = document.getElementById('featured-news');
        if (!container) return;
        
        const category = this.data.categories[news.category] || this.data.categories.general;
        
        container.innerHTML = `
            <div class="bg-gradient-to-br from-gray-100 to-white rounded-2xl p-8 shadow-xl border border-gray-200">
                <div class="flex flex-wrap items-center gap-3 mb-4">
                    ${news.featured ? '<span class="bg-brand-teal text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md">Featured</span>' : ''}
                    <span class="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-semibold">
                        ${category.name}
                    </span>
                    <span class="text-gray-600 text-sm font-medium">${this.formatDate(news.date)}</span>
                </div>
                <h3 class="text-2xl lg:text-3xl font-bold mb-4 text-brand-navy">
                    ${this.getCategoryIcon(news.category)} ${news.title}
                </h3>
                ${news.title_kr ? `<p class="text-lg lg:text-xl text-gray-700 mb-4 font-medium">${news.title_kr}</p>` : ''}
                <p class="text-gray-800 text-base lg:text-lg mb-6 leading-relaxed">${news.summary}</p>
                <button onclick="NewsManager.openNewsDetail('${news.id}')" 
                        class="bg-brand-accent text-white px-6 py-3 rounded-lg font-bold hover:bg-opacity-90 transition-all inline-flex items-center gap-2 shadow-md hover:shadow-lg">
                    Read More 
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </button>
            </div>
        `;
    },
    
    renderRecentNews() {
        const container = document.getElementById('recent-news-grid');
        if (!container) return;
        
        // Get filtered news
        let allNews = this.currentFilter === 'all' 
            ? this.data.news 
            : this.data.news.filter(n => n.category === this.currentFilter);
        
        // Sort by date and exclude featured
        const recentNews = allNews
            .filter(n => !n.featured)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6); // Always show max 6 items
        
        if (recentNews.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12 text-gray-500">
                    <div class="text-4xl mb-4">📰</div>
                    <p class="text-lg font-semibold mb-2">No news found in this category</p>
                    <p class="text-sm">Try selecting a different category</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentNews.map(news => this.createNewsCard(news)).join('');
        
        console.log(`Recent: Showing ${recentNews.length} items (${this.currentFilter} filter)`);
    },
    
    createNewsCard(news) {
        const category = this.data.categories[news.category] || this.data.categories.general;
        const categoryColors = {
            publication: 'blue',
            achievement: 'green',
            collaboration: 'purple',
            event: 'orange',
            grant: 'teal',
            general: 'gray'
        };
        const color = categoryColors[news.category] || 'gray';
        
        return `
            <article class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
                     onclick="NewsManager.openNewsDetail('${news.id}')">
                ${news.images && news.images[0] ? `
                    <div class="h-48 overflow-hidden bg-gray-100">
                        <img src="${news.images[0].url}" 
                             alt="${news.images[0].alt || news.title}"
                             class="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                             onerror="this.parentElement.style.display='none'">
                    </div>
                ` : ''}
                <div class="p-6">
                    <div class="flex items-center mb-3">
                        <span class="bg-${color}-100 text-${color}-800 text-xs px-2 py-1 rounded">
                            ${category.name}
                        </span>
                        <time class="ml-auto text-sm text-gray-500">${this.formatDate(news.date)}</time>
                    </div>
                    <h4 class="font-semibold text-brand-navy mb-2 line-clamp-2">${news.title}</h4>
                    ${news.title_kr ? `<p class="text-sm text-gray-500 mb-2 line-clamp-1">${news.title_kr}</p>` : ''}
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${news.summary}</p>
                    <span class="text-brand-accent hover:underline text-sm font-semibold">Learn more →</span>
                </div>
            </article>
        `;
    },
    
    renderNewsArchive() {
        const container = document.getElementById('news-archive');
        if (!container) return;
        
        // Get filtered archive news (items after the first 6)
        let allNews = this.currentFilter === 'all' 
            ? this.data.news 
            : this.data.news.filter(n => n.category === this.currentFilter);
        
        // Exclude featured and get items after the first 6
        const nonFeaturedNews = allNews
            .filter(n => !n.featured)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        const archiveNews = nonFeaturedNews.slice(6); // Start from 7th item
        
        // Get the archive section container
        const archiveSection = container.closest('.mt-16');
        
        if (archiveNews.length === 0) {
            // Hide entire archive section if no items
            container.innerHTML = '';
            if (archiveSection) {
                archiveSection.style.display = 'none';
            }
            return;
        } else {
            // Show archive section and render items
            if (archiveSection) {
                archiveSection.style.display = 'block';
            }
            container.innerHTML = archiveNews.map(news => this.createArchiveItem(news)).join('');
        }
        
        console.log(`Archive: Showing ${archiveNews.length} items from ${nonFeaturedNews.length} total (${this.currentFilter} filter)`);
    },
    
    createArchiveItem(news) {
        const category = this.data.categories[news.category] || this.data.categories.general;
        
        return `
            <a href="#" onclick="event.preventDefault(); NewsManager.openNewsDetail('${news.id}')" 
               class="block hover:bg-gray-50 p-6 transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center mb-2">
                            <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">${category.name}</span>
                            <time class="ml-3 text-sm text-gray-500">${this.formatDate(news.date)}</time>
                        </div>
                        <h4 class="font-semibold text-brand-navy">${news.title}</h4>
                        ${news.title_kr ? `<p class="text-sm text-gray-500 mt-1">${news.title_kr}</p>` : ''}
                    </div>
                    <svg class="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </a>
        `;
    },
    
    filterByCategory(category) {
        this.currentFilter = category;
        
        // Update filter button states
        document.querySelectorAll('.filter-btn').forEach(btn => {
            if (btn.dataset.category === category) {
                btn.classList.add('active', 'bg-brand-accent', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('active', 'bg-brand-accent', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
        
        // Re-render with filter
        this.renderRecentNews();
        this.renderNewsArchive();
    },
    
    loadMore() {
        this.currentPage++;
        this.renderRecentNews();
    },
    
    openNewsDetail(newsId) {
        const news = this.data.news.find(n => n.id === newsId);
        if (!news) return;
        
        this.currentNewsId = newsId;
        
        // Create modal container if it doesn't exist
        let modal = document.getElementById('news-detail-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'news-detail-modal';
            modal.className = 'fixed inset-0 z-50 overflow-y-auto hidden';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = this.createNewsDetailModal(news);
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    },
    
    createNewsDetailModal(news) {
        const category = this.data.categories[news.category] || this.data.categories.general;
        
        return `
            <div class="fixed inset-0 bg-black bg-opacity-50" onclick="NewsManager.closeNewsDetail()"></div>
            <div class="relative min-h-screen flex items-center justify-center p-4">
                <div class="relative bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <!-- Close button -->
                    <button onclick="NewsManager.closeNewsDetail()" 
                            class="absolute top-4 right-4 z-10 bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow">
                        <svg class="w-6 h-6 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <!-- Header -->
                    <div class="bg-gradient-to-br from-brand-navy to-brand-accent text-white p-8 rounded-t-xl">
                        <div class="flex items-center gap-3 mb-4">
                            <span class="bg-white/20 backdrop-blur text-white text-xs px-3 py-1 rounded-full">
                                ${category.name}
                            </span>
                            <time class="text-white/80 text-sm">${this.formatDate(news.date)}</time>
                            ${news.featured ? `
                                <span class="bg-brand-teal text-white text-xs px-3 py-1 rounded-full ml-auto">
                                    Featured
                                </span>
                            ` : ''}
                        </div>
                        <h1 class="text-3xl font-bold mb-2">${news.title}</h1>
                        ${news.title_kr ? `<p class="text-xl text-white/90">${news.title_kr}</p>` : ''}
                    </div>
                    
                    <!-- Content -->
                    <div class="p-8">
                        <!-- Summary -->
                        <div class="prose prose-lg max-w-none">
                            <p class="text-lg text-gray-700 leading-relaxed">${news.summary}</p>
                        </div>
                        
                        ${news.content ? this.renderNewsContent(news.content) : ''}
                        
                        <!-- Tags -->
                        ${news.tags && news.tags.length > 0 ? `
                            <div class="mt-8 pt-8 border-t">
                                <div class="flex flex-wrap gap-2">
                                    ${news.tags.map(tag => `
                                        <span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                                            #${tag}
                                        </span>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Links -->
                        ${news.links && news.links.length > 0 ? this.createLinksSection(news.links) : ''}
                    </div>
                </div>
            </div>
        `;
    },
    
    renderNewsContent(content) {
        if (!content) return '';
        
        let html = '<div class="mt-8 prose prose-lg max-w-none">';
        
        // Paragraphs
        if (content.paragraphs) {
            html += content.paragraphs.map(p => `<p class="mb-4 text-gray-700">${p}</p>`).join('');
        }
        
        // Highlights
        if (content.highlights) {
            html += `
                <div class="bg-blue-50 border-l-4 border-brand-accent p-6 my-6 rounded-r-lg">
                    <h3 class="font-semibold text-brand-navy mb-3">Key Highlights</h3>
                    <ul class="space-y-2">
                        ${content.highlights.map(h => `
                            <li class="flex items-start">
                                <span class="text-brand-accent mr-2">•</span>
                                <span class="text-gray-700">${h}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
        
        html += '</div>';
        return html;
    },
    
    createLinksSection(links) {
        return `
            <div class="mt-8 p-6 bg-gray-50 rounded-lg">
                <h3 class="font-semibold text-brand-navy mb-4">Related Links</h3>
                <div class="space-y-2">
                    ${links.map(link => `
                        <a href="${link.url}" target="_blank" rel="noopener noreferrer"
                           class="flex items-center text-brand-accent hover:underline">
                            ${this.getLinkIcon(link.type)}
                            <span class="ml-2">${link.text}</span>
                            <svg class="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    closeNewsDetail() {
        const modal = document.getElementById('news-detail-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
            this.currentNewsId = null;
        }
    },
    
    getLinkIcon(type) {
        const icons = {
            paper: `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>`,
            external: `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                       </svg>`
        };
        return icons[type] || icons.external;
    },
    
    getCategoryIcon(category) {
        const icons = {
            award: '🏆',
            publication: '📄',
            achievement: '🎓',
            collaboration: '🤝',
            event: '📅',
            grant: '💰',
            general: '📰'
        };
        return icons[category] || '';
    },
    
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    },
    
    bindEvents() {
        // Close modal on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeNewsDetail();
            }
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsManager;
}