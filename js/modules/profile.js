// Profile Manager Module
const ProfileManager = {
    currentMember: null,
    
    async init(memberId) {
        // Load member data if not already loaded
        if (!MembersManager.data) {
            await MembersManager.loadData();
        }
        
        // Find member
        const member = this.findMember(memberId);
        if (!member) {
            console.error('Member not found:', memberId);
            window.App.loadPage('members');
            return;
        }
        
        this.currentMember = member;
        
        // Update page title
        document.title = `${member.name} | UNIST Financial Engineering Lab`;
        
        // Render profile
        this.renderProfile(member);
        
        // Load publications using member ID instead of name
        await this.loadMemberPublications(memberId);
    },
    
    findMember(memberId) {
        if (!MembersManager.data) return null;
        
        const categories = [
            { key: 'professor' },
            { key: 'phd_students' },
            { key: 'ms_students' },
            { key: 'interns' }
        ];
        
        for (const cat of categories) {
            const found = MembersManager.data.current[cat.key]?.find(m => m.id === memberId);
            if (found) {
                return found;
            }
        }
        
        return null;
    },
    
    renderProfile(member) {
        // Update breadcrumb
        this.updateElement('breadcrumb-name', member.name);
        
        // Update header section
        this.renderHeader(member);
        
        // Render content sections
        this.renderAbout(member);
        this.renderResearchInterests(member);
        this.renderEducation(member);
        this.renderExperience(member);
        this.renderProjects(member);
        this.renderAwards(member);
        this.renderTeaching(member);
        this.renderService(member);
    },
    
    renderHeader(member) {
        // Profile image
        const profileImage = document.getElementById('profile-image');
        if (profileImage) {
            profileImage.src = member.image || '';
            profileImage.alt = member.name;
            profileImage.onerror = function() {
                this.onerror = null;
                const initials = member.name.split(' ').map(n => n[0]).join('');
                this.src = `https://placehold.co/200x200/0B1220/F7F9FC?text=${initials}`;
            };
        }
        
        // Name
        this.updateElement('name-english', member.name);
        if (member.name_kr) {
            this.updateElement('name-korean', member.name_kr);
            this.showElement('name-korean');
        } else {
            this.hideElement('name-korean');
        }
        
        // Position and affiliations
        this.updateElement('profile-position', member.position);
        
        if (member.department) {
            this.updateElement('profile-department', member.department);
            this.showElement('profile-department');
        } else {
            this.hideElement('profile-department');
        }
        
        if (member.institution) {
            this.updateElement('profile-institution', member.institution);
            this.showElement('profile-institution');
        } else {
            this.hideElement('profile-institution');
        }
        
        if (member.advisor) {
            this.updateElement('profile-advisor', `Advisor: ${member.advisor}`);
            this.showElement('profile-advisor');
        } else {
            this.hideElement('profile-advisor');
        }
        
        // Contact info
        this.renderContactInfo(member);
        
        // Social links
        this.renderSocialLinks(member);
    },
    
    renderContactInfo(member) {
        const container = document.getElementById('contact-info');
        if (!container) return;
        
        let html = '';
        
        if (member.email) {
            html += `
                <a href="mailto:${member.email}" class="flex items-center gap-2 text-gray-600 hover:text-brand-accent">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    ${member.email}
                </a>
            `;
        }
        
        if (member.phone) {
            html += `
                <span class="flex items-center gap-2 text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                    </svg>
                    ${member.phone}
                </span>
            `;
        }
        
        if (member.office) {
            html += `
                <span class="flex items-center gap-2 text-gray-600">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    ${member.office}
                </span>
            `;
        }
        
        container.innerHTML = html;
    },
    
    renderSocialLinks(member) {
        const container = document.getElementById('social-links');
        if (!container || !member.links) return;
        
        let html = '';
        
        const linkIcons = {
            google_scholar: {
                icon: '<path d="M12 24a7 7 0 110-14 7 7 0 010 14zm0-24L0 9.5l4.838 3.94A8 8 0 0112 9a8 8 0 017.162 4.44L24 9.5z"/>',
                title: 'Google Scholar'
            },
            linkedin: {
                icon: '<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>',
                title: 'LinkedIn'
            },
            github: {
                icon: '<path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>',
                title: 'GitHub'
            },
            facebook: {
                icon: '<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>',
                title: 'Facebook'
            },
            notion: {
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
                title: 'Notion',
                stroke: true
            },
            personal_website: {
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>',
                title: 'Website',
                stroke: true
            },
            website: {
                icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/>',
                title: 'Website',
                stroke: true
            }
        };
        
        for (const [key, url] of Object.entries(member.links)) {
            if (url && linkIcons[key]) {
                const icon = linkIcons[key];
                html += `
                    <a href="${url}" target="_blank"
                       class="p-2 bg-gray-100 rounded-lg hover:bg-brand-accent hover:text-white transition-colors"
                       title="${icon.title}">
                        <svg class="w-5 h-5" ${icon.stroke ? 'fill="none" stroke="currentColor"' : 'fill="currentColor"'} viewBox="0 0 24 24">
                            ${icon.icon}
                        </svg>
                    </a>
                `;
            }
        }
        
        container.innerHTML = html;
    },
    
    renderAbout(member) {
        if (!member.bio_full && !member.bio_short) {
            this.hideElement('about-section');
            return;
        }
        
        const content = member.bio_full || member.bio_short;
        this.updateElement('about-content', content);
        this.showElement('about-section');
    },
    
    renderResearchInterests(member) {
        if (!member.research_interests || member.research_interests.length === 0) {
            this.hideElement('interests-section');
            return;
        }
        
        const html = member.research_interests.map(interest => `
            <span class="px-4 py-2 bg-blue-50 text-brand-accent rounded-full text-sm font-medium">
                ${interest}
            </span>
        `).join('');
        
        this.updateElement('interests-content', html);
        this.showElement('interests-section');
    },
    
    renderEducation(member) {
        if (!member.education || member.education.length === 0) {
            this.hideElement('education-section');
            return;
        }
        
        const html = member.education.map(edu => `
            <div class="border-l-4 border-brand-accent pl-4">
                <h3 class="font-semibold text-lg">${edu.degree}${edu.field ? ` in ${edu.field}` : ''}</h3>
                <p class="text-gray-600">${edu.institution}</p>
                ${edu.period ? `<p class="text-gray-500">${edu.period}</p>` : 
                  edu.year ? `<p class="text-gray-500">${edu.year}</p>` : ''}
                ${edu.thesis ? `<p class="text-sm text-gray-500 mt-1"><strong>Thesis:</strong> ${edu.thesis}</p>` : ''}
                ${edu.advisor ? `<p class="text-sm text-gray-500"><strong>Advisor:</strong> ${edu.advisor}</p>` : ''}
                ${edu.honors ? `<p class="text-sm text-brand-accent mt-1">${edu.honors}</p>` : ''}
                ${edu.note ? `<p class="text-sm text-brand-accent mt-1">${edu.note}</p>` : ''}
            </div>
        `).join('');
        
        this.updateElement('education-content', html);
        this.showElement('education-section');
    },
    
    renderExperience(member) {
        if (!member.experience || member.experience.length === 0) {
            this.hideElement('experience-section');
            return;
        }
        
        const html = member.experience.map(exp => `
            <div class="border-l-4 border-gray-300 pl-4">
                <h3 class="font-semibold text-lg">${exp.position}</h3>
                <p class="text-gray-600">${exp.institution || exp.organization}</p>
                <p class="text-gray-500">${exp.period}</p>
                ${exp.advisor ? `<p class="text-sm text-gray-500 mt-1">Advisor: ${exp.advisor}</p>` : ''}
            </div>
        `).join('');
        
        this.updateElement('experience-content', html);
        this.showElement('experience-section');
    },
    
    renderProjects(member) {
        if (!member.projects || member.projects.length === 0) {
            this.hideElement('projects-section');
            return;
        }
        
        const html = member.projects.map(project => `
            <div class="border-l-4 border-green-400 pl-4">
                <h3 class="font-semibold text-lg">${project.title}</h3>
                ${project.organization ? `<p class="text-gray-600">${project.organization}</p>` : ''}
                ${project.period || project.year ? `<p class="text-gray-500">${project.period || project.year}</p>` : ''}
                ${project.description ? `<p class="text-sm text-gray-600 mt-1">${project.description}</p>` : ''}
                ${project.type ? `<span class="inline-block mt-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">${project.type}</span>` : ''}
            </div>
        `).join('');
        
        this.updateElement('projects-content', html);
        this.showElement('projects-section');
    },
    
    renderAwards(member) {
        if (!member.awards || member.awards.length === 0) {
            this.hideElement('awards-section');
            return;
        }
        
        const html = member.awards.map(award => `
            <div class="flex items-start gap-3">
                <svg class="w-5 h-5 text-amber-500 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <div class="flex-1">
                    <h3 class="font-semibold">${award.title}</h3>
                    <p class="text-gray-600">${award.organization}, ${award.year}</p>
                    ${award.paper ? `<p class="text-sm text-gray-500 mt-1">${award.paper}</p>` : ''}
                </div>
            </div>
        `).join('');
        
        this.updateElement('awards-content', html);
        this.showElement('awards-section');
    },
    
    renderTeaching(member) {
        if (!member.ta_experience || member.ta_experience.length === 0) {
            this.hideElement('teaching-section');
            return;
        }
        
        const html = member.ta_experience.map(ta => `
            <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="font-semibold">${ta.course}</h3>
                <p class="text-sm text-gray-600">${ta.semester}</p>
                ${ta.institution ? `<p class="text-sm text-gray-500">${ta.institution}</p>` : ''}
            </div>
        `).join('');
        
        this.updateElement('teaching-content', html);
        this.showElement('teaching-section');
    },
    
    renderService(member) {
        if (!member.service) {
            this.hideElement('service-section');
            return;
        }
        
        let hasContent = false;
        
        // Journals
        if (member.service.journals && member.service.journals.length > 0) {
            const html = member.service.journals.map(j => `
                <div class="pl-4 border-l-2 border-gray-200">
                    <p class="font-medium">${j.role}</p>
                    <p class="text-sm text-gray-600">${j.journal}</p>
                    ${j.special_issue ? `<p class="text-sm text-gray-500">${j.special_issue}</p>` : ''}
                    <p class="text-sm text-gray-500">${j.period}</p>
                </div>
            `).join('');
            this.updateElement('journals-content', html);
            this.showElement('service-journals');
            hasContent = true;
        }
        
        // Conferences
        if (member.service.conferences && member.service.conferences.length > 0) {
            const html = member.service.conferences.map(c => `
                <div class="pl-4 border-l-2 border-gray-200">
                    <p class="font-medium">${c.role}</p>
                    <p class="text-sm text-gray-600">${c.conference}</p>
                    <p class="text-sm text-gray-500">${c.location}, ${c.date}</p>
                </div>
            `).join('');
            this.updateElement('conferences-content', html);
            this.showElement('service-conferences');
            hasContent = true;
        }
        
        // Workshops
        if (member.service.workshops && member.service.workshops.length > 0) {
            const html = member.service.workshops.map(w => `
                <div class="bg-gray-50 rounded p-2 text-sm">${w}</div>
            `).join('');
            this.updateElement('workshops-content', html);
            this.showElement('service-workshops');
            hasContent = true;
        }
        
        // Society
        if (member.service.society && member.service.society.length > 0) {
            const html = member.service.society.map(s => `
                <div class="pl-4 border-l-2 border-gray-200">
                    <p class="font-medium">${s.role}</p>
                    <p class="text-sm text-gray-600">${s.organization}</p>
                    <p class="text-sm text-gray-500">${s.period}</p>
                </div>
            `).join('');
            this.updateElement('society-content', html);
            this.showElement('service-society');
            hasContent = true;
        }
        
        // Advisory
        if (member.service.advisory && member.service.advisory.length > 0) {
            const html = member.service.advisory.map(a => `
                <div class="pl-4 border-l-2 border-gray-200">
                    <p class="font-medium">${a.role}</p>
                    <p class="text-sm text-gray-600">${a.organization}</p>
                    <p class="text-sm text-gray-500">${a.period}</p>
                </div>
            `).join('');
            this.updateElement('advisory-content', html);
            this.showElement('service-advisory');
            hasContent = true;
        }
        
        if (hasContent) {
            this.showElement('service-section');
        } else {
            this.hideElement('service-section');
        }
    },
    
    async loadMemberPublications(memberName) {
        try {
            const response = await fetch('./data/publications.json');
            const data = await response.json();
            
            // Filter publications where the member is an author
            const memberPubs = data.publications.filter(pub => {
                const authors = pub.authors.toLowerCase();
                const searchName = memberName.toLowerCase();
                const lastName = memberName.split(' ').pop().toLowerCase();
                return authors.includes(searchName) || authors.includes(lastName);
            });
            
            const container = document.getElementById('publications-content');
            if (container) {
                if (memberPubs.length > 0) {
                    const html = memberPubs.map(pub => `
                        <div class="border-l-4 border-brand-accent pl-4 py-2">
                            <h3 class="font-semibold text-brand-navy">${pub.title}</h3>
                            <p class="text-sm text-gray-600 mt-1">${pub.authors}</p>
                            <p class="text-sm text-gray-500 italic">${pub.venue}${pub.year !== 'working_paper' ? `, ${pub.year}` : ''}</p>
                            ${pub.notes ? `<p class="text-sm text-brand-accent mt-1">${pub.notes}</p>` : ''}
                            ${pub.link ? `
                                <a href="${pub.link}" target="_blank" class="inline-block mt-2 text-sm text-brand-teal hover:underline">
                                    View Paper →
                                </a>
                            ` : ''}
                        </div>
                    `).join('');
                    container.innerHTML = html;
                } else {
                    container.innerHTML = '<p class="text-gray-500">No publications found.</p>';
                }
            }
        } catch (error) {
            console.error('Error loading publications:', error);
            const container = document.getElementById('publications-content');
            if (container) {
                container.innerHTML = '<p class="text-gray-500">Error loading publications.</p>';
            }
        }
    },
    
    // Helper methods
    updateElement(id, content) {
        const element = document.getElementById(id);
        if (element) {
            element.innerHTML = content;
        }
    },
    
    showElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('hidden');
        }
    },
    
    hideElement(id) {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('hidden');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}