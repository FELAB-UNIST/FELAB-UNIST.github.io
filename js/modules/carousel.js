// News Carousel Module for Home Page
const NewsCarousel = {
    currentIndex: 0,
    newsData: [],
    itemsToShow: 3,
    initialized: false,
    resizeTimeout: null,
    
    async init() {
        // Prevent multiple initializations
        if (this.initialized) {
            console.log('Carousel already initialized, skipping...');
            return;
        }
        
        console.log('Starting News Carousel initialization...');
        
        // First check if the carousel element exists
        const carousel = document.querySelector('#news-carousel');
        if (!carousel) {
            console.error('Carousel element not found! Looking in:', document.getElementById('main-content'));
            console.log('Current HTML:', document.getElementById('main-content')?.innerHTML.substring(0, 500));
            return;
        }
        
        console.log('Carousel element found, proceeding with initialization');
        
        this.updateItemsToShow();
        
        try {
            await this.loadNewsData();
            this.setupEventListeners();
            this.initialized = true;
            console.log('News Carousel initialized successfully');
        } catch (error) {
            console.error('Failed to initialize carousel:', error);
        }
    },
    
    // Update number of items to show based on screen size
    updateItemsToShow() {
        const width = window.innerWidth;
        
        if (width < 640) {
            this.itemsToShow = 1;
        } else if (width < 1024) {
            this.itemsToShow = 2;
        } else {
            this.itemsToShow = 3;
        }
    },
    
    // Load news data from JSON file
    async loadNewsData() {
        try {
            console.log('Loading news data from ./data/news.json...');
            const response = await fetch('./data/news.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Get the 9 most recent news items
            this.newsData = data.news
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 9);
            
            console.log(`Loaded ${this.newsData.length} news items for carousel`);
            
            this.render();
        } catch (error) {
            console.error('Failed to load news for carousel:', error);
            this.showErrorState();
        }
    },
    
    // Render the carousel
    render() {
        const carousel = document.querySelector('#news-carousel');
        if (!carousel) {
            console.error('News carousel element not found during render');
            return;
        }
        
        console.log('Rendering carousel with', this.newsData.length, 'items');
        
        carousel.innerHTML = this.newsData.map(news => this.createNewsCard(news)).join('');
        this.updatePosition();
    },
    
    // Create individual news card HTML
    createNewsCard(news) {
        return `
            <div class="flex-none w-full sm:w-1/2 lg:w-1/3 news-carousel-item" data-news-id="${news.id}">
                <div class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all h-full group cursor-pointer">
                    <div class="p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-xs px-2 py-1 bg-brand-accent/10 text-brand-accent rounded-full font-semibold">
                                ${this.formatCategoryName(news.category)}
                            </span>
                            <time class="text-xs text-gray-500">${this.formatDate(news.date)}</time>
                        </div>
                        <h4 class="font-semibold text-brand-navy mb-2 line-clamp-2 group-hover:text-brand-accent transition-colors">
                            ${news.title}
                        </h4>
                        <p class="text-sm text-gray-600 line-clamp-3">${news.summary}</p>
                    </div>
                </div>
            </div>
        `;
    },
    
    // Update carousel position based on current index
    updatePosition() {
        const carousel = document.querySelector('#news-carousel');
        if (!carousel) return;
        
        const offset = -(this.currentIndex * (100 / this.itemsToShow));
        carousel.style.transform = `translateX(${offset}%)`;
        
        this.updateButtonStates();
    },
    
    // Update prev/next button states
    updateButtonStates() {
        const prevBtn = document.getElementById('news-prev');
        const nextBtn = document.getElementById('news-next');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentIndex === 0;
            prevBtn.classList.toggle('opacity-50', this.currentIndex === 0);
            prevBtn.classList.toggle('cursor-not-allowed', this.currentIndex === 0);
        }
        
        if (nextBtn) {
            const isAtEnd = this.currentIndex >= this.newsData.length - this.itemsToShow;
            nextBtn.disabled = isAtEnd;
            nextBtn.classList.toggle('opacity-50', isAtEnd);
            nextBtn.classList.toggle('cursor-not-allowed', isAtEnd);
        }
    },
    
    // Navigate to previous items
    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updatePosition();
        }
    },
    
    // Navigate to next items
    next() {
        if (this.currentIndex < this.newsData.length - this.itemsToShow) {
            this.currentIndex++;
            this.updatePosition();
        }
    },
    
    // Setup all event listeners
    setupEventListeners() {
        // Navigation buttons
        const prevBtn = document.getElementById('news-prev');
        const nextBtn = document.getElementById('news-next');
        
        if (prevBtn) {
            prevBtn.onclick = () => this.previous();
        }
        
        if (nextBtn) {
            nextBtn.onclick = () => this.next();
        }
        
        // News card clicks - use event delegation
        const carousel = document.querySelector('#news-carousel');
        if (carousel) {
            carousel.addEventListener('click', (e) => {
                const newsItem = e.target.closest('.news-carousel-item');
                if (newsItem) {
                    const newsId = newsItem.dataset.newsId;
                    this.openNewsDetail(newsId);
                }
            });
        }
        
        // Handle window resize with debouncing
        window.addEventListener('resize', () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
    },
    
    // Handle window resize
    handleResize() {
        const prevItemsToShow = this.itemsToShow;
        this.updateItemsToShow();
        
        // Only update if items to show changed
        if (prevItemsToShow !== this.itemsToShow) {
            // Adjust current index if necessary
            this.currentIndex = Math.min(
                this.currentIndex, 
                Math.max(0, this.newsData.length - this.itemsToShow)
            );
            this.updatePosition();
        }
    },
    
    // Open news detail modal
    openNewsDetail(newsId) {
        // Navigate to news page first
        if (typeof App !== 'undefined' && App.loadPage) {
            App.loadPage('news');
            
            // Wait for page to load then open modal
            setTimeout(() => {
                if (typeof NewsManager !== 'undefined' && NewsManager.openNewsDetail) {
                    NewsManager.openNewsDetail(newsId);
                }
            }, 500);
        }
    },
    
    // Show error state if data fails to load
    showErrorState() {
        const carousel = document.querySelector('#news-carousel');
        if (carousel) {
            carousel.innerHTML = `
                <div class="w-full text-center py-8 text-gray-500">
                    <p>Unable to load news at this time.</p>
                </div>
            `;
        }
    },
    
    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 7) {
            if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays === 0) {
                return 'Today';
            }
            return `${diffDays} days ago`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return months === 1 ? '1 month ago' : `${months} months ago`;
        } else {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
    },
    
    // Format category name
    formatCategoryName(category) {
        const categoryNames = {
            'award': 'Award',
            'achievement': 'Achievement',
            'collaboration': 'Collaboration',
            'event': 'Event',
            'grant': 'Grant',
            'general': 'News'
        };
        return categoryNames[category] || 'News';
    },
    
    // Reset carousel to initial state
    reset() {
        console.log('Resetting carousel...');
        this.currentIndex = 0;
        this.newsData = [];
        this.initialized = false;
        clearTimeout(this.resizeTimeout);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NewsCarousel;
}