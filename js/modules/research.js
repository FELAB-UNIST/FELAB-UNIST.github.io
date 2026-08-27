// Research page and publication-driven coauthor network
const ResearchManager = {
    config: null,
    publications: [],
    graph: { nodes: [], links: [] },
    area: 'all',
    scrollFrame: null,
    selectedAuthor: 'yongjae-lee',

    // Short forms for the filter row, which has to fit on one line beside the
    // legend; the full names above are still used in the detail panel.
    filterLabels: {
        all: 'All',
        llms: 'LLMs',
        decisions: 'Decisions',
        assets: 'Asset Modeling',
        investors: 'Investors',
        other: 'Other'
    },

    categoryLabels: {
        all: 'All publications',
        llms: 'LLMs in Finance',
        decisions: 'Investment Decision Making',
        assets: 'Financial Asset Modeling',
        investors: 'Investor Modeling',
        other: 'Other'
    },

    async init() {
        const page = document.getElementById('research-page');
        if (!page) return;

        this.setupSectionLinks(page);

        try {
            const [configResponse, publicationResponse] = await Promise.all([
                fetch('./data/research-config.json', { cache: 'no-store' }),
                fetch('./data/publications.json', { cache: 'no-store' })
            ]);

            if (!configResponse.ok || !publicationResponse.ok) {
                throw new Error('Research data could not be loaded.');
            }

            this.config = await configResponse.json();
            const publicationData = await publicationResponse.json();
            this.publications = (publicationData.publications || [])
                .filter((publication) => !this.isWorkingPaper(publication))
                .map((publication) => ({
                    ...publication,
                    category: this.classifyPublication(publication)
                }));

            this.renderThemes();
            this.renderReviews();
            this.graph = this.buildGraph(this.publications);
            this.renderNetwork();
        } catch (error) {
            console.error('Research page initialization failed:', error);
            const networkRoot = document.getElementById('research-network-root');
            if (networkRoot) {
                networkRoot.className = 'research-network-shell research-network-state';
                networkRoot.innerHTML = '<strong>Research data is temporarily unavailable.</strong> Please try again later.';
            }
        }
    },

    setupSectionLinks(page) {
        page.addEventListener('click', (event) => {
            const link = event.target.closest('a[href^="#research-"]');
            if (!link) return;
            // Always take the click. Letting it fall through changes the hash, and
            // the router then reads "#research-areas" as a page name, fails to load
            // it, and drops the visitor at the top of the document.
            event.preventDefault();
            this.scrollToSection(link.getAttribute('href'));
        });
    },

    scrollToSection(hash, attempt = 0) {
        const target = document.querySelector(hash);
        if (target) {
            // Scroll the document explicitly. scrollIntoView() also scrolls every
            // scrollable ancestor, and .research-page is one of them because it
            // clips the orbit with overflow: hidden, which throws the position off
            // on repeat clicks.
            const offset = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            this.animateScroll(Math.max(0, Math.round(top)));
            return;
        }
        // Theme sections are rendered from JSON, so a click in the first few frames
        // can arrive before its target exists. Wait for it rather than dropping it.
        if (attempt < 60) {
            requestAnimationFrame(() => this.scrollToSection(hash, attempt + 1));
        }
    },

    // Browsers drop `behavior: "smooth"` when the OS asks for reduced motion, and
    // `scroll-behavior: smooth` on <html> would fight a per-frame loop, so each
    // step is an explicit instant scroll and the easing is done here.
    animateScroll(to, duration = 750) {
        const from = window.scrollY;
        const distance = to - from;

        if (this.scrollFrame) {
            cancelAnimationFrame(this.scrollFrame);
            this.scrollFrame = null;
        }
        if (Math.abs(distance) < 2) {
            window.scrollTo({ top: to, behavior: 'auto' });
            return;
        }

        const started = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

        const cancel = () => {
            if (this.scrollFrame) cancelAnimationFrame(this.scrollFrame);
            this.scrollFrame = null;
            detach();
        };
        const detach = () => {
            window.removeEventListener('wheel', cancel);
            window.removeEventListener('touchstart', cancel);
            window.removeEventListener('keydown', cancel);
        };
        window.addEventListener('wheel', cancel, { passive: true, once: true });
        window.addEventListener('touchstart', cancel, { passive: true, once: true });
        window.addEventListener('keydown', cancel, { once: true });

        const step = (now) => {
            const t = Math.min(1, (now - started) / duration);
            window.scrollTo({ top: Math.round(from + distance * ease(t)), behavior: 'auto' });
            if (t < 1) {
                this.scrollFrame = requestAnimationFrame(step);
            } else {
                this.scrollFrame = null;
                detach();
            }
        };
        this.scrollFrame = requestAnimationFrame(step);
    },

    isWorkingPaper(publication) {
        const fields = [publication.year, publication.type, publication.venue, publication.notes]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        return /working\s*paper/.test(fields) || String(publication.year).toLowerCase() === 'working';
    },

    classifyPublication(publication) {
        const title = String(publication.title || '').trim();
        const overrides = this.config.classificationOverrides || {};
        for (const category of ['other', 'decisions', 'assets', 'llms', 'investors']) {
            if ((overrides[category] || []).includes(title)) return category;
        }

        const searchable = `${title} ${(publication.keywords || []).join(' ')}`.toLowerCase();
        if (/household|individual investor|retail investor|couples|personalized|goal-based|financial sustainability|investor modeling|investor taxonomy|taxonomy of retail|recommender|recommendation|high-cost patients|disease-specific|\bnft\b/.test(searchable)) return 'investors';
        if (/\bllms?\b|large language model|agentic retrieval|financial security knowledge|guruagents|forecasting future language/.test(searchable)) return 'llms';
        if (/decision-focused|decision by supervised|portfolio optimization|portfolio selection|asset allocation|financial planning|mean-variance|stochastic programming|stochastic goal|sparse tangent|market making|index tracking|option to postpone a goal/.test(searchable)) return 'decisions';
        return 'assets';
    },

    renderThemes() {
        const root = document.getElementById('research-theme-sections');
        if (!root) return;
        root.innerHTML = this.config.themes.map((theme) => `
            <section class="research-theme-section" id="research-${this.escape(theme.id)}">
                <div class="research-theme-header">
                    <div class="research-theme-number">${this.escape(theme.index)}</div>
                    <div>
                        <p class="research-theme-label">Research area</p>
                        <h2>${this.escape(theme.title)}</h2>
                        <p class="research-theme-statement">${this.escape(theme.statement)}</p>
                    </div>
                    <p class="research-theme-description">${this.escape(theme.description)}</p>
                </div>
                <div class="research-subtheme-list">
                    ${theme.subthemes.map((subtheme, index) => `
                        <article class="research-subtheme-card">
                            <div class="research-subtheme-number">${this.escape(theme.index)}.${index + 1}</div>
                            <h3>${this.escape(subtheme.title)}</h3>
                            <p>${this.escape(subtheme.description)}</p>
                            ${this.paperList(subtheme.papers)}
                        </article>
                    `).join('')}
                </div>
            </section>
        `).join('');
    },

    renderReviews() {
        const root = document.getElementById('research-review-columns');
        if (!root) return;
        root.innerHTML = this.config.reviews.map((group) => `
            <article>
                <h3>${this.escape(group.group)}</h3>
                ${this.paperList(group.papers)}
            </article>
        `).join('');
    },

    paperList(papers) {
        return `<ul class="research-paper-list">${papers.map((paper) => `
            <li>
                <div>
                    <span>${this.escape(paper.venue)} · ${this.escape(paper.year)}</span>
                    <strong>${this.escape(paper.title)}</strong>
                </div>
                ${paper.link
                    ? `<a href="${this.escapeAttribute(paper.link)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${this.escapeAttribute(paper.title)}">&#8594;</a>`
                    : '<i aria-hidden="true">—</i>'}
            </li>
        `).join('')}</ul>`;
    },

    cleanAuthor(name) {
        const cleaned = name.replace(/[†*‡]/g, '').replace(/\s+/g, ' ').trim();
        return cleaned;
    },

    authorId(name) {
        return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    },

    parseAuthors(publication) {
        return String(publication.authors || '').split(',').map((name) => this.cleanAuthor(name)).filter(Boolean);
    },

    buildGraph(publications) {
        const paperMap = new Map();
        const areaMap = new Map();
        const displayNames = new Map();
        const linkMap = new Map();
        const labIds = new Set(publications.flatMap((publication) => publication.author_ids || []));

        publications.forEach((publication) => {
            const authors = [...new Set(this.parseAuthors(publication))];
            authors.forEach((name) => {
                const id = this.authorId(name);
                displayNames.set(id, name);
                paperMap.set(id, [...(paperMap.get(id) || []), publication]);
                if (!areaMap.has(id)) areaMap.set(id, new Set());
                areaMap.get(id).add(publication.category);
            });

            for (let i = 0; i < authors.length; i += 1) {
                for (let j = i + 1; j < authors.length; j += 1) {
                    const ids = [this.authorId(authors[i]), this.authorId(authors[j])].sort();
                    const key = ids.join('::');
                    const existing = linkMap.get(key) || { from: ids[0], to: ids[1], papers: [], areas: new Set() };
                    existing.papers.push(publication);
                    existing.areas.add(publication.category);
                    linkMap.set(key, existing);
                }
            }
        });

        const groups = this.config.authorGroups || {};
        const alumni = new Set(groups.alumni || []);
        const linqalpha = new Set(groups.linqalpha || []);
        const external = new Set(groups.external || []);

        const nodeInput = [...paperMap.entries()].map(([id, papers]) => {
            const name = displayNames.get(id);
            const slug = id;
            let type = 'external';
            if (name === 'Yongjae Lee') type = 'pi';
            else if (linqalpha.has(name)) type = 'linqalpha';
            else if (alumni.has(name)) type = 'alumni';
            else if (external.has(name)) type = 'external';
            else if (labIds.has(slug)) type = 'lab';

            return {
                id,
                name,
                affiliation: (this.config.affiliations || {})[name] || (type === 'lab' || type === 'pi' ? 'UNIST' : type === 'linqalpha' ? 'LinqAlpha' : 'External'),
                type,
                papers,
                areas: [...areaMap.get(id)]
            };
        }).filter((node) => node.papers.length >= 2);

        const included = new Set(nodeInput.map((node) => node.id));
        const links = [...linkMap.values()]
            .filter((link) => included.has(link.from) && included.has(link.to))
            .map((link) => ({ ...link, areas: [...link.areas] }));
        const nodes = this.positionNodes(nodeInput, links);

        return { nodes, links };
    },

    positionNodes(nodes, links) {
        const centerX = 500;
        const centerY = 410;
        const piId = this.authorId('Yongjae Lee');
        const nodeById = new Map(nodes.map((node) => [node.id, node]));
        const rest = nodes.filter((node) => node.id !== piId);

        // Single-paper links are common in large author lists and should exert a
        // light pull. Repeated collaboration grows much faster, so the detected
        // communities reflect sustained coauthorship rather than one big paper.
        const effectiveWeight = (link) => 0.3 + Math.pow(Math.max(0, link.papers.length - 1), 1.25);
        const adjacency = new Map(rest.map((node) => [node.id, []]));
        links.forEach((link) => {
            if (link.from === piId || link.to === piId) return;
            const weight = effectiveWeight(link);
            if (adjacency.has(link.from)) adjacency.get(link.from).push({ id: link.to, weight });
            if (adjacency.has(link.to)) adjacency.get(link.to).push({ id: link.from, weight });
        });

        // A compact deterministic Louvain-style pass finds the initial clusters.
        // It deliberately ignores the PI hub, otherwise nearly every author would
        // be pulled into one community before the force layout even begins.
        const degree = new Map(rest.map((node) => [
            node.id,
            (adjacency.get(node.id) || []).reduce((sum, edge) => sum + edge.weight, 0)
        ]));
        const totalDegree = [...degree.values()].reduce((sum, value) => sum + value, 0) || 1;
        const community = new Map(rest.map((node) => [node.id, node.id]));
        const communityDegree = new Map(degree);
        const order = [...rest].sort((a, b) =>
            (degree.get(b.id) - degree.get(a.id)) || a.name.localeCompare(b.name)
        );

        for (let pass = 0; pass < 28; pass += 1) {
            let moved = false;
            const offset = pass % Math.max(1, order.length);
            for (let step = 0; step < order.length; step += 1) {
                const node = order[(step + offset) % order.length];
                const nodeDegree = degree.get(node.id) || 0;
                const current = community.get(node.id);
                communityDegree.set(current, (communityDegree.get(current) || 0) - nodeDegree);

                const weightsByCommunity = new Map();
                (adjacency.get(node.id) || []).forEach((edge) => {
                    const label = community.get(edge.id);
                    weightsByCommunity.set(label, (weightsByCommunity.get(label) || 0) + edge.weight);
                });

                let best = current;
                let bestGain = 0;
                [...weightsByCommunity.entries()]
                    .sort(([a], [b]) => a.localeCompare(b))
                    .forEach(([label, inWeight]) => {
                        const expected = 1.08 * nodeDegree * (communityDegree.get(label) || 0) / totalDegree;
                        const gain = inWeight - expected;
                        if (gain > bestGain + 1e-8) {
                            best = label;
                            bestGain = gain;
                        }
                    });

                community.set(node.id, best);
                communityDegree.set(best, (communityDegree.get(best) || 0) + nodeDegree);
                if (best !== current) moved = true;
            }
            if (!moved) break;
        }

        // Fold isolated/singleton results into their strongest neighboring group
        // where possible, avoiding lone nodes floating far from collaborators.
        const membersByCommunity = () => {
            const groups = new Map();
            rest.forEach((node) => {
                const label = community.get(node.id);
                groups.set(label, [...(groups.get(label) || []), node.id]);
            });
            return groups;
        };
        membersByCommunity().forEach((members) => {
            if (members.length !== 1) return;
            const id = members[0];
            const candidates = new Map();
            (adjacency.get(id) || []).forEach((edge) => {
                const label = community.get(edge.id);
                if (label !== community.get(id)) {
                    candidates.set(label, (candidates.get(label) || 0) + edge.weight);
                }
            });
            const target = [...candidates.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
            if (target) community.set(id, target[0]);
        });

        const groups = [...membersByCommunity().values()]
            .map((ids) => ids.map((id) => nodeById.get(id)))
            .sort((a, b) => {
                const aScore = a.reduce((sum, node) => sum + node.papers.length, 0);
                const bScore = b.reduce((sum, node) => sum + node.papers.length, 0);
                return bScore - aScore || a[0].name.localeCompare(b[0].name);
            });
        const clusterCenter = new Map();
        groups.forEach((group, index) => {
            const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(1, groups.length);
            const radiusX = groups.length <= 2 ? 180 : 250;
            const radiusY = groups.length <= 2 ? 125 : 175;
            group.forEach((node) => clusterCenter.set(node.id, {
                x: centerX + Math.cos(angle) * radiusX,
                y: centerY + Math.sin(angle) * radiusY
            }));
        });

        const positioned = [];
        const positionById = new Map();
        const pi = nodeById.get(piId);
        if (pi) {
            const position = { ...pi, x: centerX, y: centerY, vx: 0, vy: 0 };
            positioned.push(position);
            positionById.set(pi.id, position);
        }
        groups.forEach((group) => {
            const ordered = [...group].sort((a, b) => b.papers.length - a.papers.length || a.name.localeCompare(b.name));
            const localRadius = 28 + Math.sqrt(group.length) * 12;
            ordered.forEach((node, index) => {
                const anchor = clusterCenter.get(node.id);
                const angle = (Math.PI * 2 * index) / Math.max(1, ordered.length) + group.length * 0.31;
                const ring = ordered.length === 1 ? 0 : localRadius * (0.6 + 0.4 * ((index % 3) / 2));
                const position = {
                    ...node,
                    x: anchor.x + Math.cos(angle) * ring,
                    y: anchor.y + Math.sin(angle) * ring * 0.72,
                    vx: 0,
                    vy: 0
                };
                positioned.push(position);
                positionById.set(node.id, position);
            });
        });

        // Settle the seeded communities with weighted springs. Stronger repeated
        // coauthorship means a shorter spring and more attraction; repulsion and
        // collision forces keep nodes readable instead of stacking them.
        for (let tick = 0; tick < 360; tick += 1) {
            const force = new Map(positioned.map((node) => [node.id, { x: 0, y: 0 }]));
            for (let i = 0; i < positioned.length; i += 1) {
                for (let j = i + 1; j < positioned.length; j += 1) {
                    const a = positioned[i];
                    const b = positioned[j];
                    let dx = a.x - b.x;
                    let dy = a.y - b.y;
                    if (Math.abs(dx) + Math.abs(dy) < 0.001) {
                        dx = ((i * 37 + j * 17) % 11 - 5) * 0.02;
                        dy = ((i * 19 + j * 31) % 13 - 6) * 0.02;
                    }
                    const distanceSquared = Math.max(64, dx * dx + dy * dy);
                    const distance = Math.sqrt(distanceSquared);
                    let push = 2200 / distanceSquared;
                    if (distance < 34) push += (34 - distance) * 0.12;
                    const fx = dx / distance * push;
                    const fy = dy / distance * push;
                    force.get(a.id).x += fx;
                    force.get(a.id).y += fy;
                    force.get(b.id).x -= fx;
                    force.get(b.id).y -= fy;
                }
            }

            links.forEach((link) => {
                const a = positionById.get(link.from);
                const b = positionById.get(link.to);
                if (!a || !b) return;
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                const repeated = Math.max(0, link.papers.length - 1);
                const piLink = link.from === piId || link.to === piId;
                const desired = piLink
                    ? Math.max(90, 172 - Math.log2(1 + link.papers.length) * 17)
                    : Math.max(48, 116 - Math.log2(1 + link.papers.length) * 20);
                const strength = (piLink ? 0.006 : 0.012) * (0.8 + Math.log2(1 + repeated));
                const pull = (distance - desired) * strength;
                const fx = dx / distance * pull;
                const fy = dy / distance * pull;
                force.get(a.id).x += fx;
                force.get(a.id).y += fy;
                force.get(b.id).x -= fx;
                force.get(b.id).y -= fy;
            });

            positioned.forEach((node) => {
                if (node.id === piId) {
                    node.x = centerX;
                    node.y = centerY;
                    node.vx = 0;
                    node.vy = 0;
                    return;
                }
                const anchor = clusterCenter.get(node.id) || { x: centerX, y: centerY };
                const f = force.get(node.id);
                f.x += (anchor.x - node.x) * 0.004 + (centerX - node.x) * 0.0007;
                f.y += (anchor.y - node.y) * 0.004 + (centerY - node.y) * 0.0007;
                const temperature = Math.max(0.7, 6 * (1 - tick / 360));
                node.vx = (node.vx + f.x) * 0.76;
                node.vy = (node.vy + f.y) * 0.76;
                const speed = Math.max(1, Math.sqrt(node.vx * node.vx + node.vy * node.vy));
                node.x += node.vx / speed * Math.min(speed, temperature);
                node.y += node.vy / speed * Math.min(speed, temperature);
            });
        }

        return positioned.map(({ vx, vy, ...node }) => ({
            ...node,
            x: Math.round(node.x * 10) / 10,
            y: Math.round(node.y * 10) / 10
        }));
    },

    // The weighted layout grows and contracts with its detected communities, so
    // fit the viewBox to what the simulation actually drew.
    networkViewBox() {
        const nodes = this.graph.nodes;
        if (!nodes.length) return '0 0 1000 820';
        const xs = nodes.map((node) => node.x);
        const ys = nodes.map((node) => node.y);
        const padX = 96;   // name + affiliation labels run wide beside outer nodes
        const padTop = 32;
        const padBottom = 44;  // labels sit below each node
        const minX = Math.min(...xs) - padX;
        const minY = Math.min(...ys) - padTop;
        const width = Math.max(...xs) + padX - minX;
        const height = Math.max(...ys) + padBottom - minY;
        return [minX, minY, width, height].map(Math.round).join(' ');
    },

    renderNetwork() {
        const root = document.getElementById('research-network-root');
        if (!root) return;
        root.className = 'research-network-shell';
        root.innerHTML = `
            <div class="research-network-toolbar">
                <div class="research-network-filters" role="group" aria-label="Filter coauthors by research area"></div>
                <div class="research-network-legend">
                    <span><i class="dot lab"></i>FE Lab</span>
                    <span><i class="dot alumni"></i>Alumni</span>
                    <span><i class="dot linqalpha"></i>LinqAlpha</span>
                    <span><i class="dot external"></i>External</span>
                </div>
            </div>
            <div class="research-network-grid">
                <div class="research-network-canvas">
                    <svg viewBox="${this.networkViewBox()}" role="img" aria-label="Interactive coauthor network"></svg>
                    <div class="research-network-note">Frequent coauthors are placed closer together. The network includes collaborators with two or more publications; select any node for details.</div>
                </div>
                <aside class="research-network-detail" aria-live="polite"></aside>
            </div>
        `;

        root.querySelector('.research-network-filters').addEventListener('click', (event) => {
            const button = event.target.closest('button[data-area]');
            if (!button) return;
            this.area = button.dataset.area;
            this.updateNetwork();
        });

        root.querySelector('svg').addEventListener('click', (event) => {
            const node = event.target.closest('[data-author-id]');
            if (!node || node.classList.contains('muted')) return;
            this.selectedAuthor = node.dataset.authorId;
            this.updateNetwork();
        });

        root.querySelector('svg').addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            const node = event.target.closest('[data-author-id]');
            if (!node || node.classList.contains('muted')) return;
            event.preventDefault();
            this.selectedAuthor = node.dataset.authorId;
            this.updateNetwork();
        });

        // SVG has no z-index: paint order is document order, so a hovered node and
        // its label sit under every sibling that comes after it. Move it last.
        const raise = (event) => {
            const group = event.target.closest('.research-network-node');
            if (!group || group.classList.contains('muted')) return;
            const layer = group.parentNode;
            if (layer && layer.lastElementChild !== group) layer.appendChild(group);
        };
        root.querySelector('svg').addEventListener('mouseover', raise);
        root.querySelector('svg').addEventListener('focusin', raise);

        root.querySelector('.research-network-detail').addEventListener('click', (event) => {
            const button = event.target.closest('button[data-area]');
            if (!button) return;
            this.area = button.dataset.area;
            this.updateNetwork();
        });

        this.updateNetwork();
    },

    updateNetwork() {
        const root = document.getElementById('research-network-root');
        if (!root) return;
        const counts = this.publications.reduce((result, paper) => {
            result[paper.category] = (result[paper.category] || 0) + 1;
            return result;
        }, {});

        const filters = root.querySelector('.research-network-filters');
        filters.innerHTML = Object.keys(this.categoryLabels).map((id) => `
            <button type="button" data-area="${id}" class="${this.area === id ? 'selected' : ''}">
                ${this.escape(this.filterLabels[id] || this.categoryLabels[id])}
                <span>${id === 'all' ? this.publications.length : (counts[id] || 0)}</span>
            </button>
        `).join('');

        const nodeById = new Map(this.graph.nodes.map((node) => [node.id, node]));
        let selectedNode = nodeById.get(this.selectedAuthor) || this.graph.nodes.find((node) => node.name === 'Yongjae Lee') || this.graph.nodes[0];
        if (selectedNode) this.selectedAuthor = selectedNode.id;

        const activePaperIds = new Set(this.publications
            .filter((paper) => this.area === 'all' || paper.category === this.area)
            .map((paper) => `${paper.title}-${paper.year}`));
        const activeIds = new Set(this.graph.nodes
            .filter((node) => node.papers.some((paper) => activePaperIds.has(`${paper.title}-${paper.year}`)))
            .map((node) => node.id));

        const linksMarkup = this.graph.links.map((link) => {
            const from = nodeById.get(link.from);
            const to = nodeById.get(link.to);
            const activeCount = link.papers.filter((paper) => this.area === 'all' || paper.category === this.area).length;
            const connected = selectedNode && (link.from === selectedNode.id || link.to === selectedNode.id);
            const className = activeCount ? (connected ? 'selected-link' : 'active') : 'muted';
            const width = activeCount ? Math.min(5, 0.35 + activeCount * 0.55) : 0.3;
            return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="${className}" stroke-width="${width}"></line>`;
        }).join('');

        const nodesMarkup = this.graph.nodes.map((node) => {
            const active = activeIds.has(node.id);
            const chosen = selectedNode && selectedNode.id === node.id;
            const filteredCount = node.papers.filter((paper) => this.area === 'all' || paper.category === this.area).length;
            const radius = node.type === 'pi' ? 24 : Math.min(15, 4.5 + Math.sqrt(filteredCount || node.papers.length) * 2.1);
            // No standing labels: every name appears on hover, focus, or selection.
            const showLabel = chosen;
            return `
                <g class="research-network-node ${node.type} ${active ? 'active' : 'muted'} ${chosen ? 'chosen' : ''} ${showLabel ? 'labeled' : ''}"
                   data-author-id="${this.escapeAttribute(node.id)}" role="button" tabindex="${active ? 0 : -1}"
                   aria-label="${this.escapeAttribute(`${node.name}, ${node.affiliation}, ${filteredCount} publications in this view`)}">
                    <circle cx="${node.x}" cy="${node.y}" r="${radius + 7}" class="node-halo"></circle>
                    <circle cx="${node.x}" cy="${node.y}" r="${radius}" class="node-circle"></circle>
                    <text x="${node.x}" y="${node.y + radius + 15}" text-anchor="middle" class="node-label">${this.escape(node.name)}</text>
                    <text x="${node.x}" y="${node.y + radius + 26}" text-anchor="middle" class="node-affiliation">${this.escape(node.affiliation)}</text>
                    ${node.type === 'pi' ? `<text x="${node.x}" y="${node.y + 4}" text-anchor="middle" class="pi-label">PI</text>` : ''}
                </g>
            `;
        }).join('');

        root.querySelector('svg').innerHTML = `<g class="research-network-links">${linksMarkup}</g><g>${nodesMarkup}</g>`;
        root.querySelector('svg').setAttribute('aria-label', `Interactive coauthor network built from ${activePaperIds.size} publications`);

        if (selectedNode) this.renderNetworkDetail(root, selectedNode);

    },

    renderNetworkDetail(root, node) {
        const selectedPapers = node.papers
            .filter((paper) => this.area === 'all' || paper.category === this.area)
            .sort((a, b) => String(b.year).localeCompare(String(a.year)));
        const collaborators = new Set(this.graph.links
            .filter((link) => link.from === node.id || link.to === node.id)
            .flatMap((link) => [link.from, link.to])
            .filter((id) => id !== node.id)).size;

        root.querySelector('.research-network-detail').innerHTML = `
            <p class="research-detail-kicker">Selected collaborator</p>
            <h3>${this.escape(node.name)}</h3>
            <p class="research-detail-affiliation">${this.escape(node.affiliation)}</p>
            <div class="research-detail-stats">
                <div><strong>${selectedPapers.length}</strong><span>${this.area === 'all' ? 'total publications' : 'papers in this area'}</span></div>
                <div><strong>${collaborators}</strong><span>direct coauthors</span></div>
            </div>
            <div class="research-detail-areas">
                <span>Research connections</span>
                <div>${node.areas.map((id) => `<button type="button" data-area="${id}">${this.escape(this.categoryLabels[id])}</button>`).join('')}</div>
            </div>
            <div class="research-detail-papers">
                <span>${this.escape(this.area === 'all' ? 'Publications' : this.categoryLabels[this.area])}</span>
                <ul>${selectedPapers.slice(0, 5).map((paper) => `
                    <li>
                        <small>${this.escape(paper.year)} · ${this.escape(this.categoryLabels[paper.category])}</small>
                        ${paper.link
                            ? `<a href="${this.escapeAttribute(paper.link)}" target="_blank" rel="noopener noreferrer">${this.escape(paper.title)}</a>`
                            : this.escape(paper.title)}
                    </li>
                `).join('')}</ul>
                ${selectedPapers.length > 5 ? `<p class="research-detail-more">+ ${selectedPapers.length - 5} more publications</p>` : ''}
            </div>
        `;
    },

    escape(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    },

    escapeAttribute(value) {
        return this.escape(value);
    }
};

window.ResearchManager = ResearchManager;
