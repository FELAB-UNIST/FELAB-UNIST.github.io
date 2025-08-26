// Members Manager Module
const MembersManager = {
    data: null,
    initialized: false,
    
    async init() {
        if (this.initialized) return;
        
        await this.loadData();
        this.render();
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
                container.innerHTML = this.createMemberCards(current.professor);
            }
        }
        
        // Render PhD Students
        if (current.phd_students) {
            const container = document.getElementById('phd-students-container');
            if (container) {
                container.innerHTML = this.createMemberCards(current.phd_students);
            }
        }
        
        // Render MS Students
        if (current.ms_students) {
            const container = document.getElementById('ms-students-container');
            if (container) {
                container.innerHTML = this.createMemberCards(current.ms_students);
            }
        }
        
        // Render Interns
        if (current.interns) {
            const container = document.getElementById('interns-container');
            if (container) {
                container.innerHTML = this.createInternCards(current.interns);
            }
        }
    },
    
    createMemberCards(members) {
        return members.map(member => `
            <div class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-6 cursor-pointer" 
                 onclick="openDrawer('member-${member.id}')">
                <div class="text-center">
                    <div class="mb-4">
                        <img src="${member.image}" 
                             alt="${member.name}" 
                             class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-100"
                             onerror="this.onerror=null; this.src='https://placehold.co/200x200/0B1220/F7F9FC?text=${this.getInitials(member.name)}'">
                    </div>
                    <h5 class="font-semibold text-brand-navy text-lg">${member.name}</h5>
                    <p class="text-sm text-gray-600 mt-1">${member.position}</p>
                    ${member.email ? `
                        <a href="mailto:${member.email}" 
                           class="text-xs text-brand-accent hover:underline mt-2 inline-block"
                           onclick="event.stopPropagation()">
                           ${member.email}
                        </a>
                    ` : ''}
                    ${member.website ? `
                        <a href="${member.website}" 
                           target="_blank"
                           class="text-xs text-brand-accent hover:underline mt-1 inline-block"
                           onclick="event.stopPropagation()">
                           Website
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },
    
    createInternCards(interns) {
        return interns.map(intern => `
            <div class="bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow p-6 cursor-pointer border-l-4 border-brand-teal" 
                 onclick="openDrawer('member-${intern.id}')">
                <div class="text-center">
                    <div class="mb-4">
                        <img src="${intern.image}" 
                             alt="${intern.name}" 
                             class="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-100"
                             onerror="this.onerror=null; this.src='https://placehold.co/200x200/0BB37F/F7F9FC?text=${this.getInitials(intern.name)}'">
                    </div>
                    <h5 class="font-semibold text-brand-navy text-lg">${intern.name}</h5>
                    <p class="text-sm text-gray-600 mt-1">${intern.position}</p>
                    ${intern.university ? `
                        <p class="text-xs text-gray-500 mt-1">${intern.university}</p>
                    ` : ''}
                    ${intern.duration ? `
                        <span class="inline-block mt-2 px-2 py-1 text-xs bg-brand-teal text-white rounded-full">
                            ${intern.duration}
                        </span>
                    ` : ''}
                </div>
            </div>
        `).join('');
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
        
        // Render Former Interns
        if (alumni.interns) {
            const container = document.getElementById('former-interns-container');
            if (container) {
                container.innerHTML = this.createFormerInternsList(alumni.interns);
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
                            <span class="text-sm text-gray-500">Class of ${person.year}</span>
                        </div>
                        ${person.thesis ? `
                            <p class="text-sm text-gray-600 mt-2">
                                <strong>Thesis:</strong> ${person.thesis}
                            </p>
                        ` : ''}
                        ${person.current_position ? `
                            <p class="text-sm text-brand-accent mt-1">
                                <strong>Current:</strong> ${person.current_position}
                            </p>
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
            <div class="bg-white rounded-lg p-6 border-l-4 border-gray-400 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h5 class="font-semibold text-brand-navy">
                            ${person.name}
                            ${person.name_kr ? `<span class="text-gray-500 font-normal">(${person.name_kr})</span>` : ''}
                        </h5>
                        ${person.current_position ? `
                            <p class="text-sm text-brand-accent mt-1">
                                ${person.current_position}
                            </p>
                        ` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        ${person.links ? this.createAlumniLinks(person.links) : ''}
                    </div>
                </div>
            </div>
        `).join('');
    },
    
    createFormerInternsList(interns) {
        return interns.map(intern => `
            <div class="bg-white rounded-lg p-6 border-l-4 border-brand-teal hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-3">
                            <h5 class="font-semibold text-brand-navy">
                                ${intern.name}
                                ${intern.name_kr ? `<span class="text-gray-500 font-normal">(${intern.name_kr})</span>` : ''}
                            </h5>
                            <span class="text-sm text-gray-500">${intern.year}</span>
                        </div>
                        <div class="mt-2 space-y-1">
                            ${intern.university ? `
                                <p class="text-sm text-gray-600">
                                    <strong>University:</strong> ${intern.university}
                                </p>
                            ` : ''}
                            ${intern.duration ? `
                                <p class="text-sm text-gray-600">
                                    <strong>Duration:</strong> ${intern.duration}
                                </p>
                            ` : ''}
                            ${intern.current_position ? `
                                <p class="text-sm text-brand-accent">
                                    <strong>Current:</strong> ${intern.current_position}
                                </p>
                            ` : ''}
                        </div>
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
        
        if (links.notion) {
            html += `
                <a href="${links.notion}" 
                   target="_blank" 
                   class="text-gray-400 hover:text-brand-accent transition-colors"
                   title="Notion">
                    <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </a>
            `;
        }
        
        return html;
    },
    
    getInitials(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MembersManager;
}