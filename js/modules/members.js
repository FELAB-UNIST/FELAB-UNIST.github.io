// Members Manager Module
const MembersManager = {
    data: null,
    initialized: false,
    
    async init() {
        this.initialized = false;
        
        await this.loadData();
        this.render();
        this.setupMemberClicks();
        this.initialized = true;
    },
    
    async loadData() {
        try {
            const response = await fetch('./data/members.json');
            this.data = await response.json();
        } catch (error) {
            console.error('Failed to load members data:', error);
            this.data = { current: {}, alumni: {} };
        }
    },
    
    render() {
        if (!this.data) return;
        
        // Render current members
        this.renderCurrentMembers();
        
        // Render alumni
        this.renderAlumni();
    },
    
    renderCurrentMembers() {
        const { current } = this.data;
        
        // Render Professor
        if (current.professor) {
            const container = document.getElementById('professor-container');
            if (container) {
                container.innerHTML = this.createMemberCards(current.professor, 'professor');
            }
        }
        
        // Render PhD Students
        if (current.phd_students) {
            const container = document.getElementById('phd-students-container');
            if (container) {
                container.innerHTML = this.createMemberCards(current.phd_students, 'phd');
            }
        }
        
        // Render MS Students
        if (current.ms_students) {
            const container = document.getElementById('ms-students-container');
            if (container) {
                container.innerHTML = this.createMemberCards(current.ms_students, 'ms');
            }
        }
        
        // Render Interns
        if (current.interns) {
            const container = document.getElementById('interns-container');
            if (container) {
                container.innerHTML = this.createMemberCards(current.interns, 'intern');
            }
        }
    },
    
    createMemberCards(members, category) {
        return members.map(member => {
            // Build social links dynamically
            let linkButtons = '';
            
            // Email link
            if (member.email) {
                linkButtons += `
                    <div class="text-gray-400 hover:text-brand-accent transition-colors"
                         onclick="event.preventDefault(); event.stopPropagation(); window.location.href='mailto:${member.email}'">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                `;
            }
            
            // Process links if they exist
            if (member.links) {
                // LinkedIn
                if (member.links.linkedin) {
                    linkButtons += `
                        <div class="text-gray-400 hover:text-brand-accent transition-colors"
                             onclick="event.preventDefault(); event.stopPropagation(); window.open('${member.links.linkedin}', '_blank')">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                        </div>
                    `;
                }
                
                // GitHub - Check if the link is actually GitHub or mislabeled LinkedIn
                if (member.links.github) {
                    // Check URL to determine correct icon
                    if (member.links.github.includes('linkedin.com')) {
                        // It's actually a LinkedIn link
                        linkButtons += `
                            <div class="text-gray-400 hover:text-brand-accent transition-colors"
                                 onclick="event.preventDefault(); event.stopPropagation(); window.open('${member.links.github}', '_blank')">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                                </svg>
                            </div>
                        `;
                    } else {
                        // Assume it's a GitHub link
                        linkButtons += `
                            <div class="text-gray-400 hover:text-brand-accent transition-colors"
                                 onclick="event.preventDefault(); event.stopPropagation(); window.open('${member.links.github}', '_blank')">
                                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                </svg>
                            </div>
                        `;
                    }
                }
                
                // Website
                if (member.links.website) {
                    linkButtons += `
                        <div class="text-gray-400 hover:text-brand-accent transition-colors"
                             onclick="event.preventDefault(); event.stopPropagation(); window.open('${member.links.website}', '_blank')">
                            <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                    `;
                }
                
                // Google Scholar
                if (member.links.google_scholar) {
                    linkButtons += `
                        <div class="text-gray-400 hover:text-brand-accent transition-colors"
                             onclick="event.preventDefault(); event.stopPropagation(); window.open('${member.links.google_scholar}', '_blank')">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 24a7 7 0 110-14 7 7 0 010 14zm0-24L0 9.5l4.838 3.94A8 8 0 0112 9a8 8 0 017.162 4.44L24 9.5z"/>
                            </svg>
                        </div>
                    `;
                }
            }
            
            return `
                <a href="#profile/${member.id}" 
                   class="member-card block bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-6 cursor-pointer"
                   data-member-id="${member.id}"
                   data-category="${category}">
                    <div class="text-center">
                        <div class="mb-4">
                            <img src="${member.image}" 
                                 alt="${member.name}" 
                                 class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-100"
                                 onerror="this.onerror=null; this.src='https://placehold.co/200x200/0B1220/F7F9FC?text=${this.getInitials(member.name)}'">
                        </div>
                        <h5 class="font-semibold text-brand-navy text-lg">${member.name}</h5>
                        ${member.name_kr ? `<p class="text-sm text-gray-500">${member.name_kr}</p>` : ''}
                        <p class="text-sm text-gray-600 mt-1">${member.position}</p>
                        ${member.bio_short ? `
                            <p class="text-xs text-gray-500 mt-2 line-clamp-2">${member.bio_short}</p>
                        ` : ''}
                        ${linkButtons ? `
                            <div class="mt-3 flex justify-center gap-3">
                                ${linkButtons}
                            </div>
                        ` : ''}
                    </div>
                </a>
            `;
        }).join('');
    },
    
    setupMemberClicks() {
        // Handle member card clicks for navigation
        document.addEventListener('click', (e) => {
            const memberCard = e.target.closest('.member-card');
            if (memberCard && memberCard.dataset.memberId) {
                e.preventDefault();
                const memberId = memberCard.dataset.memberId;
                const category = memberCard.dataset.category;
                
                // Navigate to profile page
                window.App.loadProfile(memberId, category);
            }
        });
    },
    
    renderAlumni() {
        const { alumni } = this.data;
        
        // Render PhD Alumni
        if (alumni.phd) {
            const container = document.getElementById('phd-alumni-container');
            if (container) {
                container.innerHTML = this.createAlumniList(alumni.phd);
            }
        }
        
        // Render MS Alumni
        if (alumni.ms) {
            const container = document.getElementById('ms-alumni-container');
            if (container) {
                container.innerHTML = this.createAlumniList(alumni.ms);
            }
        }
        
        // Render Research Professors
        if (alumni.research_professors) {
            const container = document.getElementById('research-professors-container');
            if (container) {
                container.innerHTML = this.createResearchProfessorsList(alumni.research_professors);
            }
        }
    },
    
    createAlumniList(alumni) {
        return alumni.map(person => `
            <div class="bg-white rounded-lg p-6 border-l-4 border-brand-accent hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3">
                            <h5 class="font-semibold text-brand-navy">
                                ${person.name}
                                ${person.name_kr ? `<span class="text-gray-500 font-normal">(${person.name_kr})</span>` : ''}
                            </h5>
                        </div>
                        ${person.period ? `
                            <p class="text-sm text-gray-600 mt-2">
                                <strong>Period:</strong> ${person.period}
                            </p>
                        ` : ''}
                        ${person.postdoc ? `
                            <p class="text-sm text-gray-600">
                                <strong>Postdoc:</strong> ${person.postdoc}
                            </p>
                        ` : ''}
                        ${person.current_position ? `
                            <p class="text-sm text-brand-accent mt-1">
                                <strong>Current:</strong> ${person.current_position}
                            </p>
                        ` : ''}
                        ${person.notes ? `
                            <p class="text-sm text-gray-500 italic mt-1">${person.notes}</p>
                        ` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        ${person.links ? this.createAlumniLinks(person.links) : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    createResearchProfessorsList(professors) {
        return professors.map(person => `
            <div class="bg-white rounded-lg p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h5 class="font-semibold text-brand-navy">
                            ${person.name}
                            ${person.name_kr ? `<span class="text-gray-500 font-normal">(${person.name_kr})</span>` : ''}
                        </h5>
                        ${person.period ? `
                            <p class="text-sm text-gray-600 mt-2">
                                <strong>Period:</strong> ${person.period}
                            </p>
                        ` : ''}
                        ${person.position ? `
                            <p class="text-sm text-gray-600">
                                <strong>Position at Lab:</strong> ${person.position}
                            </p>
                        ` : ''}
                        ${person.previous ? `
                            <p class="text-sm text-gray-600">
                                <strong>Previous:</strong> ${person.previous}
                            </p>
                        ` : ''}
                        ${person.current_position ? `
                            <p class="text-sm text-brand-accent mt-1">
                                <strong>Current:</strong> ${person.current_position}
                            </p>
                        ` : ''}
                        ${person.notes ? `
                            <p class="text-sm text-gray-500 italic mt-1">${person.notes}</p>
                        ` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        ${person.links ? this.createAlumniLinks(person.links) : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    createAlumniLinks(links) {
        let html = '';
        
        if (links.website) {
            html += `
                <a href="${links.website}" 
                   target="_blank" 
                   class="text-gray-400 hover:text-brand-accent transition-colors"
                   title="Website">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                </a>
            `;
        }
        
        if (links.linkedin) {
            html += `
                <a href="${links.linkedin}" 
                   target="_blank" 
                   class="text-gray-400 hover:text-brand-accent transition-colors"
                   title="LinkedIn">
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                </a>
            `;
        }
        
        return html;
    },
    
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    },
    
    // Get member data by ID and category
    getMemberById(memberId, category) {
        if (!this.data) return null;
        
        const categoryMap = {
            'professor': 'professor',
            'phd': 'phd_students',
            'ms': 'ms_students',
            'intern': 'interns'
        };
        
        const dataCategory = categoryMap[category];
        if (!dataCategory || !this.data.current[dataCategory]) return null;
        
        return this.data.current[dataCategory].find(m => m.id === memberId);
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MembersManager;
}