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
        } catch (error) {
            console.error('Failed to load news data:', error);
            this.data = { news: [], categories: {} };
        }
    },
    
    render() {
        this.renderFeaturedNews();
        this.renderRecentNews();
        this.renderNewsArchive();
    },
    
    renderFeaturedNews() {
        const featured = this.data.news.find(n => n.featured);
        if (!featured) return;
        
        const container = document.getElementById('featured-news');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex items-center mb-4">
                <span class="bg-brand-teal text-white text-xs px-3 py-1 rounded-full font-semibold">Featured</span>
                <span class="ml-3 text-white/80 text-sm">${this.formatDate(featured.date)}</span>
            </div>
            <h3 class="text-2xl font-bold mb-4">
                ${this.getCategoryIcon(featured.category)} ${featured.title}
            </h3>
            <p class="text-white/90 text-lg mb-6">${featured.summary}</p>
            <button onclick="NewsManager.openNewsDetail('${featured.id}')" 
                    class="bg-white text-brand-navy px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                Read More →
            </button>
        `;
    },
    
    renderRecentNews() {
        const container = document.getElementById('recent-news-grid');
        if (!container) return;
        
        // Get recent non-featured news (limit to 6)
        const recentNews = this.data.news
            .filter(n => !n.featured)
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 6);
        
        container.innerHTML = recentNews.map(news => this.createNewsCard(news)).join('');
    },
    
    createNewsCard(news) {
        const category = this.data.categories[news.category] || this.data.categories.general;
        
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
                        <span class="bg-${category.color}-100 text-${category.color}-800 text-xs px-2 py-1 rounded">
                            ${category.name}
                        </span>
                        <time class="ml-auto text-sm text-gray-500">${this.formatDate(news.date)}</time>
                    </div>
                    <h4 class="font-semibold text-brand-navy mb-2">${news.title}</h4>
                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${news.summary}</p>
                    <span class="text-brand-accent hover:underline text-sm font-semibold">Learn more →</span>
                </div>
            </article>
        `;
    },
    
    renderNewsArchive() {
        const container = document.getElementById('news-archive');
        if (!container) return;
        
        // Get older news
        const archiveNews = this.data.news
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(6, 15); // Show next 9 items
        
        container.innerHTML = archiveNews.map(news => this.createArchiveItem(news)).join('');
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
                    </div>
                    <svg class="w-5 h-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                </div>
            </a>
        `;
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
        
        // Initialize image gallery if present
        if (news.gallery) {
            this.initImageGallery();
        }
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
                        <!-- Main Images -->
                        ${this.createMainImages(news.images)}
                        
                        <!-- Article Content -->
                        <div class="prose prose-lg max-w-none mt-8">
                            ${this.renderNewsContent(news.content)}
                        </div>
                        
                        <!-- Image Gallery -->
                        ${this.createImageGallery(news.gallery)}
                        
                        <!-- Links Section -->
                        ${this.createLinksSection(news.links)}
                        
                        <!-- Tags -->
                        ${this.createTagsSection(news.tags)}
                        
                        <!-- Related News -->
                        ${this.createRelatedNews(news.related_news)}
                    </div>
                </div>
            </div>
        `;
    },
    
    createMainImages(images) {
        if (!images || images.length === 0) return '';
        
        if (images.length === 1) {
            return `
                <figure class="mb-8">
                    <img src="${images[0].url}" 
                         alt="${images[0].alt}"
                         class="w-full rounded-lg shadow-lg"
                         onerror="this.onerror=null; this.parentElement.style.display='none'">
                    ${images[0].caption ? `
                        <figcaption class="text-center text-sm text-gray-600 mt-3">
                            ${images[0].caption}
                        </figcaption>
                    ` : ''}
                </figure>
            `;
        }
        
        // Multiple images - create a grid
        return `
            <div class="grid ${images.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4 mb-8">
                ${images.map(img => `
                    <figure>
                        <img src="${img.url}" 
                             alt="${img.alt}"
                             class="w-full h-48 object-cover rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                             onclick="NewsManager.openImageLightbox('${img.url}')"
                             onerror="this.onerror=null; this.style.display='none'">
                        ${img.caption ? `
                            <figcaption class="text-xs text-gray-600 mt-2 text-center">
                                ${img.caption}
                            </figcaption>
                        ` : ''}
                    </figure>
                `).join('')}
            </div>
        `;
    },
    
    renderNewsContent(content) {
        if (!content) return '';
        
        let html = '';
        
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
        
        // Quotes
        if (content.quotes) {
            content.quotes.forEach(quote => {
                html += `
                    <blockquote class="border-l-4 border-gray-300 pl-6 py-2 my-6 italic">
                        <p class="text-gray-700 mb-2">"${quote.text}"</p>
                        <footer class="text-sm text-gray-600">— ${quote.author}</footer>
                    </blockquote>
                `;
            });
        }
        
        // List Sections
        if (content.list_sections) {
            content.list_sections.forEach(section => {
                html += `
                    <div class="my-6">
                        <h3 class="font-semibold text-brand-navy mb-3">${section.title}</h3>
                        <ul class="space-y-2">
                            ${section.items.map(item => `
                                <li class="flex items-start">
                                    <span class="text-brand-accent mr-2">•</span>
                                    <span class="text-gray-700">${item}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            });
        }
        
        return html;
    },
    
    createImageGallery(gallery) {
        if (!gallery || !gallery.images || gallery.images.length === 0) return '';
        
        return `
            <div class="my-8 border-t pt-8">
                <h3 class="font-semibold text-brand-navy mb-4">${gallery.title || 'Photo Gallery'}</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="image-gallery">
                    ${gallery.images.map((img, idx) => `
                        <div class="cursor-pointer hover:opacity-90 transition-opacity"
                             onclick="NewsManager.openGalleryLightbox(${idx})">
                            <img src="${img.thumbnail || img.url}" 
                                 alt="${img.caption}"
                                 class="w-full h-32 object-cover rounded-lg shadow-md">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    createLinksSection(links) {
        if (!links || links.length === 0) return '';
        
        return `
            <div class="my-8 p-6 bg-gray-50 rounded-lg">
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
    
    createTagsSection(tags) {
        if (!tags || tags.length === 0) return '';
        
        return `
            <div class="my-6">
                <div class="flex flex-wrap gap-2">
                    ${tags.map(tag => `
                        <span class="bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                            #${tag}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    },
    
    createRelatedNews(relatedIds) {
        if (!relatedIds || relatedIds.length === 0) return '';
        
        const relatedNews = relatedIds
            .map(id => this.data.news.find(n => n.id === id))
            .filter(n => n);
        
        if (relatedNews.length === 0) return '';
        
        return `
            <div class="my-8 pt-8 border-t">
                <h3 class="font-semibold text-brand-navy mb-4">Related News</h3>
                <div class="grid md:grid-cols-2 gap-4">
                    ${relatedNews.map(news => `
                        <a href="#" onclick="event.preventDefault(); NewsManager.openNewsDetail('${news.id}')"
                           class="block p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex items-start">
                                ${news.images && news.images[0] ? `
                                    <img src="${news.images[0].url}" 
                                         alt="${news.title}"
                                         class="w-20 h-20 object-cover rounded mr-4 flex-shrink-0">
                                ` : ''}
                                <div class="flex-1">
                                    <h4 class="font-medium text-brand-navy mb-1">${news.title}</h4>
                                    <p class="text-sm text-gray-600">${this.formatDate(news.date)}</p>
                                </div>
                            </div>
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
    
    openImageLightbox(imageUrl) {
        // Create lightbox for single image
        const lightbox = document.createElement('div');
        lightbox.className = 'fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4';
        lightbox.onclick = () => lightbox.remove();
        
        lightbox.innerHTML = `
            <img src="${imageUrl}" class="max-w-full max-h-full object-contain">
            <button onclick="this.parentElement.remove()" 
                    class="absolute top-4 right-4 bg-white rounded-full p-2">
                <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        `;
        
        document.body.appendChild(lightbox);
    },
    
    openGalleryLightbox(startIndex) {
        const news = this.data.news.find(n => n.id === this.currentNewsId);
        if (!news || !news.gallery) return;
        
        // Create gallery lightbox with navigation
        let currentIndex = startIndex;
        
        const lightbox = document.createElement('div');
        lightbox.id = 'gallery-lightbox';
        lightbox.className = 'fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center';
        
        const updateImage = () => {
            const img = news.gallery.images[currentIndex];
            lightbox.innerHTML = `
                <div class="relative max-w-6xl w-full h-full flex items-center justify-center p-4">
                    <img src="${img.url}" class="max-w-full max-h-full object-contain">
                    
                    <!-- Navigation -->
                    <button onclick="NewsManager.galleryPrev()" 
                            class="absolute left-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button onclick="NewsManager.galleryNext()" 
                            class="absolute right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    
                    <!-- Close button -->
                    <button onclick="NewsManager.closeGalleryLightbox()" 
                            class="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-colors">
                        <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    
                    <!-- Caption -->
                    ${img.caption ? `
                        <div class="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur text-white p-4 rounded-lg">
                            <p class="text-center">${img.caption}</p>
                            <p class="text-center text-sm mt-2">${currentIndex + 1} / ${news.gallery.images.length}</p>
                        </div>
                    ` : ''}
                </div>
            `;
        };
        
        // Store navigation functions
        this.galleryPrev = () => {
            currentIndex = (currentIndex - 1 + news.gallery.images.length) % news.gallery.images.length;
            updateImage();
        };
        
        this.galleryNext = () => {
            currentIndex = (currentIndex + 1) % news.gallery.images.length;
            updateImage();
        };
        
        this.closeGalleryLightbox = () => {
            lightbox.remove();
        };
        
        updateImage();
        document.body.appendChild(lightbox);
        
        // Keyboard navigation
        const handleKeyboard = (e) => {
            if (e.key === 'ArrowLeft') this.galleryPrev();
            if (e.key === 'ArrowRight') this.galleryNext();
            if (e.key === 'Escape') {
                this.closeGalleryLightbox();
                document.removeEventListener('keydown', handleKeyboard);
            }
        };
        document.addEventListener('keydown', handleKeyboard);
    },
    
    initFilters() {
        const filterContainer = document.getElementById('news-filters');
        if (!filterContainer) return;
        
        const categories = Object.entries(this.data.categories);
        
        filterContainer.innerHTML = `
            <button onclick="NewsManager.filterByCategory('all')" 
                    class="filter-btn active px-4 py-2 text-sm font-medium bg-brand-accent text-white rounded-lg">
                All
            </button>
            ${categories.map(([key, cat]) => `
                <button onclick="NewsManager.filterByCategory('${key}')" 
                        class="filter-btn px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    ${cat.name}
                </button>
            `).join('')}
        `;
    },
    
    filterByCategory(category) {
        this.currentFilter = category;
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active', 'bg-brand-accent', 'text-white');
            btn.classList.add('bg-gray-200', 'text-gray-700');
        });
        event.target.classList.add('active', 'bg-brand-accent', 'text-white');
        event.target.classList.remove('bg-gray-200', 'text-gray-700');
        
        // Re-render with filter
        this.render();
    },
    
    getLinkIcon(type) {
        const icons = {
            paper: `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>`,
            external: `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                       </svg>`,
            video: `<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
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