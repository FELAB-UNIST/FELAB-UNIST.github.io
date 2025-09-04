    // Profile Manager Module
    const ProfileManager = {
        memberData: null,
        publicationsData: null,
        currentMemberId: null,
        
        async init(memberId) {
            console.log('Initializing profile for:', memberId);
            this.currentMemberId = memberId;
            
            // Load data
            await this.loadData();
            
            // Find member
            const member = this.findMember(memberId);
            
            if (member) {
                this.renderProfile(member);
                this.renderPublications(member);
            } else {
                console.error('Member not found:', memberId);
                // Redirect to members page if member not found
                window.location.hash = '#members';
            }
        },
        
        async loadData() {
            try {
                // Load members data
                const membersResponse = await fetch('./data/members.json');
                this.memberData = await membersResponse.json();
                
                // Load publications data
                const pubsResponse = await fetch('./data/publications.json');
                this.publicationsData = await pubsResponse.json();
            } catch (error) {
                console.error('Failed to load data:', error);
            }
        },
        
        findMember(memberId) {
            if (!this.memberData) return null;
            
            const { current } = this.memberData;
            
            // Search in all categories
            const categories = ['professor', 'phd_students', 'ms_students', 'interns'];
            
            for (const category of categories) {
                if (current[category]) {
                    const member = current[category].find(m => m.id === memberId);
                    if (member) {
                        member.category = category;
                        return member;
                    }
                }
            }
            
            return null;
        },
        
        renderProfile(member) {
            // Update breadcrumb
            const breadcrumb = document.getElementById('breadcrumb-name');
            if (breadcrumb) breadcrumb.textContent = member.name;
            
            // Update profile image
            const profileImage = document.getElementById('profile-image');
            if (profileImage) {
                profileImage.src = member.image || 'https://placehold.co/200x200/0B1220/F7F9FC?text=Profile';
                profileImage.alt = member.name;
            }
            
            // Update name
            const nameEnglish = document.getElementById('name-english');
            const nameKorean = document.getElementById('name-korean');
            if (nameEnglish) nameEnglish.textContent = member.name;
            if (nameKorean && member.name_kr) {
                nameKorean.textContent = `(${member.name_kr})`;
            } else if (nameKorean) {
                nameKorean.style.display = 'none';
            }
            
            // Update position and institution
            const position = document.getElementById('profile-position');
            const department = document.getElementById('profile-department');
            const institution = document.getElementById('profile-institution');
            const advisor = document.getElementById('profile-advisor');
            
            if (position) position.textContent = member.position || '';
            if (department) department.textContent = member.department || member.program || '';
            if (institution) institution.textContent = member.institution || 'UNIST';
            
            if (advisor && member.advisor) {
                advisor.innerHTML = `<strong>Advisor:</strong> ${member.advisor}`;
            } else if (advisor) {
                advisor.style.display = 'none';
            }
            
            // Update contact info
            this.renderContactInfo(member);
            
            // Update social links
            this.renderSocialLinks(member);
            
            // Render sections based on available data
            this.renderSections(member);
        },
        
        renderContactInfo(member) {
            const container = document.getElementById('contact-info');
            if (!container) return;
            
            let html = '';
            
            if (member.email) {
                html += `
                    <a href="mailto:${member.email}" 
                    class="flex items-center gap-2 text-gray-600 hover:text-brand-accent">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>${member.email}</span>
                    </a>
                `;
            }
            
            if (member.office) {
                html += `
                    <div class="flex items-center gap-2 text-gray-600">
                        <svg class="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>${member.office}</span>
                    </div>
                `;
            }
            
            container.innerHTML = html;
        },
        
        renderSocialLinks(member) {
            const container = document.getElementById('social-links');
            if (!container || !member.links) return;
            
            let html = '';
            
            if (member.links.google_scholar) {
                html += `
                    <a href="${member.links.google_scholar}" 
                    target="_blank"
                    class="text-gray-400 hover:text-brand-accent transition-colors"
                    title="Google Scholar">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 24a7 7 0 110-14 7 7 0 010 14zm0-24L0 9.5l4.838 3.94A8 8 0 0112 9a8 8 0 017.162 4.44L24 9.5z"/>
                        </svg>
                    </a>
                `;
            }
            
            if (member.links.linkedin) {
                html += `
                    <a href="${member.links.linkedin}" 
                    target="_blank"
                    class="text-gray-400 hover:text-brand-accent transition-colors"
                    title="LinkedIn">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                    </a>
                `;
            }
            
            if (member.links.github) {
                html += `
                    <a href="${member.links.github}" 
                    target="_blank"
                    class="text-gray-400 hover:text-brand-accent transition-colors"
                    title="GitHub">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                    </a>
                `;
            }

            if (member.links.facebook) {
                html += `
                    <a href="${member.links.facebook}" 
                    target="_blank"
                    class="text-gray-400 hover:text-brand-accent transition-colors"
                    title="Facebook">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                        </svg>
                    </a>
                `;
            }
            
            if (member.links.website) {
                html += `
                    <a href="${member.links.website}" 
                    target="_blank"
                    class="text-gray-400 hover:text-brand-accent transition-colors"
                    title="Personal Website">
                        <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </a>
                `;
            }
            
            container.innerHTML = html;
        },
        
        renderSections(member) {
            // About section
            this.renderAbout(member);
            
            // Research Interests
            this.renderInterests(member);
            
            // Education
            this.renderEducation(member);
            
            // Experience
            this.renderExperience(member);
            
            // Projects
            this.renderProjects(member);
            
            // Awards
            this.renderAwards(member);
            
            // Teaching
            this.renderTeaching(member);
            
            // Service (for professors)
            this.renderService(member);
        },
        
        renderAbout(member) {
            const section = document.getElementById('about-section');
            const content = document.getElementById('about-content');
            
            if (member.bio_full || member.bio_short) {
                section.classList.remove('hidden');
                content.innerHTML = member.bio_full || member.bio_short;
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderInterests(member) {
            const section = document.getElementById('interests-section');
            const content = document.getElementById('interests-content');
            
            if (member.research_interests && member.research_interests.length > 0) {
                section.classList.remove('hidden');
                content.innerHTML = member.research_interests.map(interest => 
                    `<span class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">${interest}</span>`
                ).join('');
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderEducation(member) {
            const section = document.getElementById('education-section');
            const content = document.getElementById('education-content');
            
            if (member.education && member.education.length > 0) {
                section.classList.remove('hidden');
                content.innerHTML = member.education.map(edu => `
                    <div class="border-l-4 border-brand-accent pl-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-brand-navy">
                                    ${edu.degree} in ${edu.field}
                                </h4>
                                <p class="text-gray-600">${edu.institution}</p>
                                ${edu.thesis ? `<p class="text-sm text-gray-500 mt-1">Thesis: "${edu.thesis}"</p>` : ''}
                                ${edu.advisor ? `<p class="text-sm text-gray-500">Advisor: ${edu.advisor}</p>` : ''}
                                ${edu.honors ? `<p class="text-sm text-brand-accent mt-1">${edu.honors}</p>` : ''}
                                ${edu.note ? `<p class="text-sm text-gray-500 italic mt-1">${edu.note}</p>` : ''}
                            </div>
                            <span class="text-gray-500 text-sm">${edu.period || edu.year}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderExperience(member) {
            const section = document.getElementById('experience-section');
            const content = document.getElementById('experience-content');
            
            if (member.experience && member.experience.length > 0) {
                section.classList.remove('hidden');
                content.innerHTML = member.experience.map(exp => `
                    <div class="border-l-4 border-green-500 pl-4">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-semibold text-brand-navy">${exp.position}</h4>
                                <p class="text-gray-600">${exp.institution || exp.organization}</p>
                                ${exp.advisor ? `<p class="text-sm text-gray-500">Advisor: ${exp.advisor}</p>` : ''}
                            </div>
                            <span class="text-gray-500 text-sm">${exp.period}</span>
                        </div>
                    </div>
                `).join('');
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderProjects(member) {
            const section = document.getElementById('projects-section');
            const content = document.getElementById('projects-content');
            
            if (member.projects && member.projects.length > 0) {
                section.classList.remove('hidden');
                content.innerHTML = member.projects.map(project => `
                    <div class="border-l-4 border-purple-500 pl-4">
                        <h4 class="font-semibold text-brand-navy">${project.title}</h4>
                        ${project.organization ? `<p class="text-gray-600">${project.organization}</p>` : ''}
                        <div class="flex gap-4 mt-1">
                            ${project.period || project.year ? `<span class="text-sm text-gray-500">${project.period || project.year}</span>` : ''}
                            ${project.type ? `<span class="text-sm px-2 py-1 bg-gray-100 rounded">${project.type}</span>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderAwards(member) {
            const section = document.getElementById('awards-section');
            const content = document.getElementById('awards-content');
            
            if (member.awards && member.awards.length > 0) {
                section.classList.remove('hidden');
                content.innerHTML = member.awards.map(award => `
                    <div class="flex items-start gap-3">
                        <svg class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                        <div class="flex-1">
                            <p class="font-medium text-brand-navy">${award.title}</p>
                            <p class="text-sm text-gray-600">${award.organization}, ${award.year}</p>
                            ${award.paper ? `<p class="text-sm text-gray-500 mt-1">Paper: "${award.paper}"</p>` : ''}
                        </div>
                    </div>
                `).join('');
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderTeaching(member) {
            const section = document.getElementById('teaching-section');
            const content = document.getElementById('teaching-content');
            
            if (member.ta_experience && member.ta_experience.length > 0) {
                section.classList.remove('hidden');
                content.innerHTML = member.ta_experience.map(ta => `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-brand-navy">${ta.course}</h4>
                        <p class="text-sm text-gray-600">${ta.semester}</p>
                        <p class="text-sm text-gray-500">${ta.institution}</p>
                    </div>
                `).join('');
            } else {
                section.classList.add('hidden');
            }
        },
        
        renderService(member) {
            const section = document.getElementById('service-section');
            
            if (!member.service) {
                section.classList.add('hidden');
                return;
            }
            
            section.classList.remove('hidden');
            
            // Render each service category
            if (member.service.journals && member.service.journals.length > 0) {
                document.getElementById('service-journals').classList.remove('hidden');
                document.getElementById('journals-content').innerHTML = member.service.journals.map(item => `
                    <div class="bg-gray-50 rounded-lg p-3">
                        <p class="font-medium text-brand-navy">${item.role}</p>
                        <p class="text-sm text-gray-600">${item.journal}</p>
                        ${item.special_issue ? `<p class="text-xs text-gray-500">Special Issue: ${item.special_issue}</p>` : ''}
                        <p class="text-xs text-gray-500">${item.period}</p>
                    </div>
                `).join('');
            }
            
            if (member.service.conferences && member.service.conferences.length > 0) {
                document.getElementById('service-conferences').classList.remove('hidden');
                document.getElementById('conferences-content').innerHTML = member.service.conferences.map(item => `
                    <div class="bg-gray-50 rounded-lg p-3">
                        <p class="font-medium text-brand-navy">${item.role}</p>
                        <p class="text-sm text-gray-600">${item.conference}</p>
                        <p class="text-xs text-gray-500">${item.location}, ${item.date}</p>
                    </div>
                `).join('');
            }
            
            if (member.service.workshops && member.service.workshops.length > 0) {
                document.getElementById('service-workshops').classList.remove('hidden');
                document.getElementById('workshops-content').innerHTML = member.service.workshops.map(workshop => 
                    `<div class="bg-gray-50 rounded-lg p-2 text-sm">${workshop}</div>`
                ).join('');
            }
            
            if (member.service.society && member.service.society.length > 0) {
                document.getElementById('service-society').classList.remove('hidden');
                document.getElementById('society-content').innerHTML = member.service.society.map(item => `
                    <div class="bg-gray-50 rounded-lg p-3">
                        <p class="font-medium text-brand-navy">${item.role}</p>
                        <p class="text-sm text-gray-600">${item.organization}</p>
                        <p class="text-xs text-gray-500">${item.period}</p>
                    </div>
                `).join('');
            }
            
            if (member.service.advisory && member.service.advisory.length > 0) {
                document.getElementById('service-advisory').classList.remove('hidden');
                document.getElementById('advisory-content').innerHTML = member.service.advisory.map(item => `
                    <div class="bg-gray-50 rounded-lg p-3">
                        <p class="font-medium text-brand-navy">${item.role}</p>
                        <p class="text-sm text-gray-600">${item.organization}</p>
                        <p class="text-xs text-gray-500">${item.period}</p>
                    </div>
                `).join('');
            }
        },
        
        renderPublications(member) {
            const container = document.getElementById('publications-content');
            if (!container || !this.publicationsData) return;
            
            // Filter publications where this member is an author
            const memberPubs = this.publicationsData.publications.filter(pub => {
                return pub.author_ids && pub.author_ids.includes(member.id);
            });
            
            console.log(`Found ${memberPubs.length} publications for ${member.name} (id: ${member.id})`);
            
            if (memberPubs.length === 0) {
                container.innerHTML = `
                    <div class="text-gray-500 text-center py-8">
                        <p>No publications found.</p>
                    </div>
                `;
                return;
            }
            
            // Group publications by year
            const pubsByYear = {};
            memberPubs.forEach(pub => {
                const year = pub.year === 'working_paper' ? 'Working Papers' : pub.year;
                if (!pubsByYear[year]) {
                    pubsByYear[year] = [];
                }
                pubsByYear[year].push(pub);
            });
            
            // Sort years (Working Papers at the end)
            const years = Object.keys(pubsByYear).sort((a, b) => {
                if (a === 'Working Papers') return 1;
                if (b === 'Working Papers') return -1;
                return b - a;
            });
            
            // Render publications
            let html = '';
            years.forEach(year => {
                html += `
                    <div class="mb-8">
                        <h3 class="text-lg font-bold text-brand-navy mb-4 pb-2 border-b">${year}</h3>
                        <div class="space-y-4">
                `;
                
                pubsByYear[year].forEach(pub => {
                    html += `
                        <div class="publication-item p-4 hover:bg-gray-50 rounded-lg transition-colors">
                            <div class="text-sm">
                                <div class="mb-2">
                                    ${this.formatAuthors(pub.authors, member.id)}
                                </div>
                                <div class="font-semibold text-brand-navy mb-1">
                                    ${pub.link ? `<a href="${pub.link}" target="_blank" class="hover:text-brand-accent transition-colors">${pub.title}</a>` : pub.title}
                                </div>
                                ${pub.venue ? `<div class="text-gray-600 italic">${pub.venue}</div>` : ''}
                                ${pub.notes ? `<div class="text-gray-500 text-xs mt-1">${pub.notes}</div>` : ''}
                                ${pub.keywords ? `
                                    <div class="flex gap-2 mt-2">
                                        ${pub.keywords.map(keyword => 
                                            `<span class="text-xs px-2 py-1 bg-gray-100 rounded">${keyword}</span>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
        },
        
        formatAuthors(authorsString, currentMemberId) {
            // Parse authors string and highlight current member
            const authors = authorsString.split(',').map(author => author.trim());
            
            return authors.map(author => {
                // Check if this author is the current member
                // Look for special markers like *, †, or check if it matches member name
                const isCurrentMember = this.isAuthorCurrentMember(author, currentMemberId);
                const isLabMember = this.isLabMember(author);
                
                if (isCurrentMember) {
                    return `<span class="font-semibold text-brand-accent">${author}</span>`;
                } else if (isLabMember) {
                    return `<span class="text-author-pi">${author}</span>`;
                } else {
                    return `<span class="text-author-external">${author}</span>`;
                }
            }).join(', ');
        },
        
        isAuthorCurrentMember(authorName, memberId) {
            // Get member data
            const member = this.findMember(memberId);
            if (!member) return false;
            
            // Clean author name (remove special characters)
            const cleanAuthor = authorName.replace(/[*†‡§¶]/g, '').trim();
            
            // Check if author name contains member's name
            return cleanAuthor.includes(member.name);
        },
        
        isLabMember(authorName) {
            // Clean author name
            const cleanAuthor = authorName.replace(/[*†‡§¶]/g, '').trim();
            
            // List of known lab members from the data
            const labMembers = [];
            const { current } = this.memberData;
            
            // Collect all lab member names
            ['professor', 'phd_students', 'ms_students', 'interns'].forEach(category => {
                if (current[category]) {
                    current[category].forEach(member => {
                        labMembers.push(member.name);
                    });
                }
            });
            
            // Also check alumni
            if (this.memberData.alumni) {
                ['phd', 'ms', 'research_professors'].forEach(category => {
                    if (this.memberData.alumni[category]) {
                        this.memberData.alumni[category].forEach(member => {
                            labMembers.push(member.name);
                        });
                    }
                });
            }
            
            // Check if author is in lab members list
            return labMembers.some(memberName => cleanAuthor.includes(memberName));
        }
    };

    // Export for use in other modules
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = ProfileManager;
    }