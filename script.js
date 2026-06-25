document.addEventListener('DOMContentLoaded', () => {
    // ==========================================================================
    // User Session & Database Initialization
    // ==========================================================================
    const currentUserId = db.getUserId();

    // ==========================================================================
    // Admin State & Password Controls
    // ==========================================================================
    let isAdminActive = false;

    const adminLoginBtn = document.getElementById('admin-login-btn');
    const adminBadge = document.getElementById('admin-badge');
    const adminLogoutBtn = document.getElementById('admin-logout-btn');
    const changePwdBtn = document.getElementById('change-pwd-btn');

    function setAdminState(active) {
        isAdminActive = active;
        if (active) {
            if (adminLoginBtn) adminLoginBtn.classList.add('hidden');
            if (adminBadge) adminBadge.classList.remove('hidden');
            sessionStorage.setItem('admin-active', 'true');
        } else {
            if (adminLoginBtn) adminLoginBtn.classList.remove('hidden');
            if (adminBadge) adminBadge.classList.add('hidden');
            sessionStorage.removeItem('admin-active');
        }
        renderMural();
        
        // If details modal is open, re-render comments to update admin tools
        if (activePostId) {
            const post = posts.find(p => p.id === activePostId);
            if (post) {
                renderComments(post);
                updateDetailsModalLikes(post);
            }
        }
    }

    // Check if admin session is already active in current tab
    if (sessionStorage.getItem('admin-active') === 'true') {
        setAdminState(true);
    }

    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', () => {
            const pwd = prompt("Digite a senha de Administrador para acessar a moderação:");
            if (pwd === db.getAdminPassword()) {
                setAdminState(true);
                alert("Acesso Administrador concedido. Você já pode editar/excluir qualquer post ou comentário.");
            } else if (pwd !== null) {
                alert("Senha incorreta!");
            }
        });
    }

    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener('click', () => {
            setAdminState(false);
            alert("Você saiu do modo Administrador.");
        });
    }

    // Change Admin Password logic
    if (changePwdBtn) {
        changePwdBtn.addEventListener('click', () => {
            const currentPwd = prompt("Digite a senha atual de Administrador para verificação:");
            if (currentPwd === db.getAdminPassword()) {
                const newPwd = prompt("Digite a nova senha de Administrador:");
                if (newPwd) {
                    const confirmPwd = prompt("Confirme a nova senha de Administrador:");
                    if (newPwd === confirmPwd) {
                        if (db.setAdminPassword(newPwd)) {
                            alert("Senha de Administrador alterada com sucesso! Guarde-a em segurança.");
                        } else {
                            alert("Senha inválida.");
                        }
                    } else if (confirmPwd !== null) {
                        alert("As senhas não coincidem!");
                    }
                }
            } else if (currentPwd !== null) {
                alert("Senha atual incorreta!");
            }
        });
    }

    // ==========================================================================
    // Core Layout & Sidebar (Mobile controls)
    // ==========================================================================
    const sidebar = document.getElementById('app-sidebar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');

    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.add('active');
        });
    }

    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.classList.remove('active');
        });
    }

    // ==========================================================================
    // Theme Management (Dark / Light Mode)
    // ==========================================================================
    const themeBtn = document.getElementById('theme-btn');
    const mobileThemeBtn = document.getElementById('mobile-theme-btn');
    
    function applyTheme(theme) {
        const themeIcon = themeBtn.querySelector('.icon');
        const mobileThemeIcon = mobileThemeBtn ? mobileThemeBtn.querySelector('.icon') : null;
        
        if (theme === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            themeIcon.textContent = '🌙';
            if (mobileThemeIcon) mobileThemeIcon.textContent = '🌙';
        } else {
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
            themeIcon.textContent = '☀';
            if (mobileThemeIcon) mobileThemeIcon.textContent = '☀';
        }
    }

    const savedTheme = db.getTheme();
    applyTheme(savedTheme);

    function toggleTheme() {
        const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
        db.setTheme(newTheme);
    }

    themeBtn.addEventListener('click', toggleTheme);
    if (mobileThemeBtn) mobileThemeBtn.addEventListener('click', toggleTheme);

    // ==========================================================================
    // Navigation / Tab Switcher
    // ==========================================================================
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            // Update nav buttons
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            // Switch tabs
            tabContents.forEach(tab => {
                tab.classList.remove('active');
                if (tab.id === `tab-${targetTab}`) {
                    tab.classList.add('active');
                }
            });

            // Close sidebar on mobile
            sidebar.classList.remove('active');
            
            // Scroll to top of content
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });

    // ==========================================================================
    // Accordion Interaction (Scripture Accordion)
    // ==========================================================================
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            const isActive = item.classList.contains('active');
            
            // Close other items
            document.querySelectorAll('.accordion-item').forEach(i => {
                i.classList.remove('active');
            });
            
            // Toggle clicked item
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ==========================================================================
    // Modal Interaction (Scriptures / Deep Dives)
    // ==========================================================================
    const scriptureModal = document.getElementById('scripture-modal');
    const scriptureModalBody = document.getElementById('scripture-modal-body');
    const scriptureModalClose = document.getElementById('scripture-modal-close');
    const scriptureLink = document.getElementById('scripture-link-john');

    const biblePassages = {
        john15: {
            title: "João 15:5 — Permanecendo na Videira",
            verse: "“Eu sou a videira, vós as varas; quem está em mim, e eu nele, esse dá muito fruto; porque sem mim nada podeis fazer.”",
            context: "Jesus deixa claro que a santidade e a produtividade da vida cristã não são conquistas que fabricamos por esforço próprio. Elas são a consequência orgânica de estar intimamente conectado com Ele. Quando tentamos ser santos sob a força do legalismo, somos como um galho seco tentando produzir uvas à força."
        }
    };

    if (scriptureLink) {
        scriptureLink.addEventListener('click', () => {
            const passageKey = scriptureLink.getAttribute('data-verse');
            const data = biblePassages[passageKey];
            
            if (data) {
                scriptureModalBody.innerHTML = `
                    <h2 class="modal-title">${data.title}</h2>
                    <p class="bible-verse" style="font-size: 1.25rem; line-height: 1.6; margin-bottom: 1.5rem;">${data.verse}</p>
                    <p style="color: var(--text-secondary); line-height: 1.6;">${data.context}</p>
                `;
                scriptureModal.classList.add('active');
            }
        });
    }

    const closeScriptureModal = () => {
        scriptureModal.classList.remove('active');
    };

    if (scriptureModalClose) scriptureModalClose.addEventListener('click', closeScriptureModal);
    if (scriptureModal) {
        scriptureModal.addEventListener('click', (e) => {
            if (e.target === scriptureModal) closeScriptureModal();
        });
    }

    // ==========================================================================
    // Autosave Journal Logic (using db wrapper)
    // ==========================================================================
    const journalInput = document.getElementById('journal-input');
    const saveStatus = document.getElementById('save-status');
    const clearBtn = document.getElementById('clear-btn');
    let saveTimeout = null;

    if (journalInput) {
        // Load saved journal from db
        journalInput.value = db.getJournal();

        journalInput.addEventListener('input', () => {
            saveStatus.textContent = 'Digitando...';
            saveStatus.className = 'saving';
            
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                try {
                    db.saveJournal(journalInput.value);
                    saveStatus.textContent = 'Salvo automaticamente';
                    saveStatus.className = 'saved';
                } catch (e) {
                    saveStatus.textContent = 'Erro ao salvar!';
                    saveStatus.className = '';
                }
            }, 1000);
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm('Tem certeza de que deseja limpar suas anotações? Isso não pode ser desfeito.')) {
                journalInput.value = '';
                db.clearJournal();
                saveStatus.textContent = 'Diário limpo';
                saveStatus.className = '';
            }
        });
    }

    // ==========================================================================
    // Mural da Comunidade (CRUD & Interações via db wrapper)
    // ==========================================================================
    const muralGrid = document.getElementById('mural-grid');
    const newPostBtn = document.getElementById('new-post-btn');
    const postModal = document.getElementById('post-modal');
    const postModalClose = document.getElementById('post-modal-close');
    const postModalCancel = document.getElementById('post-modal-cancel');
    const postForm = document.getElementById('post-form');
    const formPostId = document.getElementById('form-post-id');
    const formAuthor = document.getElementById('form-author');
    const formTitle = document.getElementById('form-title');
    const formContent = document.getElementById('form-content');
    const modalFormTitle = document.getElementById('modal-form-title');

    // Details Modal elements
    const detailsModal = document.getElementById('details-modal');
    const detailsModalClose = document.getElementById('details-modal-close');
    const detailTitle = document.getElementById('detail-title');
    const detailAuthor = document.getElementById('detail-author');
    const detailDate = document.getElementById('detail-date');
    const detailContent = document.getElementById('detail-content');
    const detailLikeBtn = document.getElementById('detail-like-btn');
    const detailLikeCount = document.getElementById('detail-like-count');
    const detailCommentCount = document.getElementById('detail-comment-count');
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentAuthorInput = document.getElementById('comment-author');
    const commentTextInput = document.getElementById('comment-text');

    let activePostId = null; 
    let posts = [];

    // Mock initial posts
    const mockPosts = [
        {
            id: 'mock-1',
            title: "De Volta para a Graça",
            author: "Manoel Neto",
            content: "Por anos vivi sob o peso de regras e lideranças que transformavam a mesa da ceia num tribunal. Quando entendi que a santidade é permanecer em Cristo (Jo 15), e não cumprir ordens para ser aceito, meu coração achou paz. A ceia hoje é celebração do que Ele fez por mim!",
            date: "24/06/2026",
            likes: 8,
            likedByUser: false,
            comments: [
                { id: 'c-1', author: "Esther R.", text: "Que depoimento lindo! Também passei por isso e sei o alívio que é entender a cruz.", date: "24/06/2026", userId: 'usr-mock-1' }
            ],
            userCreated: false
        },
        {
            id: 'mock-2',
            title: "O Fardo da Religião",
            author: "Carla Souza",
            content: "Me identifico muito com o texto principal. A ceia como limpador de pecados é um grande engano teológico. Já falhei na minha mente tantas vezes e achei que tomar o pão apagaria isso, mas o sangue d'Ele na cruz é o único agente purificador definitivo. Que libertação!",
            date: "23/06/2026",
            likes: 12,
            likedByUser: false,
            comments: [],
            userCreated: false
        },
        {
            id: 'mock-3',
            title: "A Santidade é Fruto",
            author: "Pastor André",
            content: "Excelente reflexão. Como líderes, precisamos parar de sobrecarregar as ovelhas com legalismos vazios. Santidade é fruto de relacionamento íntimo com Cristo. A mesa é lugar de comunhão e gratidão, não de culpa.",
            date: "22/06/2026",
            likes: 15,
            likedByUser: false,
            comments: [
                { id: 'c-2', author: "Carlos", text: "Amém pastor, que tenhamos mais ensinos focados na videira verdadeira.", date: "23/06/2026", userId: 'usr-mock-2' }
            ],
            userCreated: false
        }
    ];

    function loadPosts() {
        posts = db.getPosts(mockPosts);
    }

    function savePosts() {
        db.savePosts(posts);
    }

    function renderMural() {
        if (!muralGrid) return;
        muralGrid.innerHTML = '';

        if (posts.length === 0) {
            muralGrid.innerHTML = `<div class="no-posts">Nenhuma reflexão compartilhada ainda. Seja o primeiro!</div>`;
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            const ownershipClass = post.userCreated ? 'user-owned' : (isAdminActive ? 'admin-view' : '');
            card.className = `post-card ${ownershipClass}`;
            card.setAttribute('data-id', post.id);

            const hasLiked = post.likedByUser ? 'liked' : '';
            const commentsCount = post.comments.length;
            
            const canManage = post.userCreated || isAdminActive;

            card.innerHTML = `
                <div class="post-header">
                    <span class="post-author">✍ ${post.author} ${post.userCreated ? '(Você)' : (isAdminActive && !post.userCreated ? '(Moderação)' : '')}</span>
                    <span class="post-date">${post.date}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.content}</p>
                <div class="post-footer">
                    <div class="post-stats">
                        <button class="stat-item like-toggle-btn ${hasLiked}">
                            <span class="icon">❤</span> <span class="like-count">${post.likes}</span>
                        </button>
                        <button class="stat-item open-comments-btn">
                            <span class="icon">💬</span> <span>${commentsCount}</span>
                        </button>
                    </div>
                    <div class="post-actions">
                        ${canManage ? `
                            <button class="card-action-btn edit-btn">Editar</button>
                            <button class="card-action-btn delete-btn">Excluir</button>
                        ` : ''}
                        <button class="card-action-btn open-details-btn">Ler mais</button>
                    </div>
                </div>
            `;

            // Wire card event listeners
            const likeBtn = card.querySelector('.like-toggle-btn');
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleLike(post.id);
            });

            const commentsBtn = card.querySelector('.open-comments-btn');
            commentsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDetails(post.id);
            });

            const detailsBtn = card.querySelector('.open-details-btn');
            detailsBtn.addEventListener('click', () => {
                openDetails(post.id);
            });

            if (canManage) {
                const editBtn = card.querySelector('.edit-btn');
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    openEditPost(post.id);
                });

                const deleteBtn = card.querySelector('.delete-btn');
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deletePost(post.id);
                });
            }

            muralGrid.appendChild(card);
        });
    }

    // Create New Post Modal
    if (newPostBtn) {
        newPostBtn.addEventListener('click', () => {
            modalFormTitle.textContent = "Nova Reflexão";
            formPostId.value = "";
            formAuthor.value = db.getDefaultAuthor();
            formTitle.value = "";
            formContent.value = "";
            postModal.classList.add('active');
        });
    }

    const closePostModal = () => {
        postModal.classList.remove('active');
        postForm.reset();
    };

    if (postModalClose) postModalClose.addEventListener('click', closePostModal);
    if (postModalCancel) postModalCancel.addEventListener('click', closePostModal);
    
    // Form Submit (Create or Edit)
    if (postForm) {
        postForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = formPostId.value;
            const author = formAuthor.value.trim();
            const title = formTitle.value.trim();
            const content = formContent.value.trim();
            const today = new Date().toLocaleDateString('pt-BR');

            // Save default name in db
            db.setDefaultAuthor(author);

            if (id) {
                // Edit
                const index = posts.findIndex(p => p.id === id);
                if (index !== -1 && (posts[index].userCreated || isAdminActive)) {
                    posts[index].title = title;
                    posts[index].author = author;
                    posts[index].content = content;
                    posts[index].date = today;
                }
            } else {
                // Create
                const newPost = {
                    id: 'post-' + Date.now(),
                    title: title,
                    author: author,
                    content: content,
                    date: today,
                    likes: 0,
                    likedByUser: false,
                    comments: [],
                    userCreated: true
                };
                posts.unshift(newPost);
            }

            savePosts();
            renderMural();
            closePostModal();
        });
    }

    // Edit Post
    function openEditPost(id) {
        const post = posts.find(p => p.id === id);
        if (!post || (!post.userCreated && !isAdminActive)) return;

        modalFormTitle.textContent = "Editar Reflexão";
        formPostId.value = post.id;
        formAuthor.value = post.author;
        formTitle.value = post.title;
        formContent.value = post.content;
        postModal.classList.add('active');
    }

    // Delete Post
    function deletePost(id) {
        if (confirm("Deseja realmente excluir esta reflexão do Mural?")) {
            posts = posts.filter(p => p.id !== id);
            savePosts();
            renderMural();
            
            if (activePostId === id) {
                closeDetailsModal();
            }
        }
    }

    // Toggle Like
    function toggleLike(id) {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        if (post.likedByUser) {
            post.likes = Math.max(0, post.likes - 1);
            post.likedByUser = false;
        } else {
            post.likes += 1;
            post.likedByUser = true;
        }

        savePosts();
        renderMural();
        
        if (activePostId === id) {
            updateDetailsModalLikes(post);
        }
    }

    // Details Modal functions
    function openDetails(id) {
        const post = posts.find(p => p.id === id);
        if (!post) return;

        activePostId = id;
        detailTitle.textContent = post.title;
        detailAuthor.textContent = `Por: ${post.author}`;
        detailDate.textContent = post.date;
        detailContent.innerHTML = post.content.replace(/\n/g, '<br>');
        
        updateDetailsModalLikes(post);
        renderComments(post);

        detailsModal.classList.add('active');
    }

    function updateDetailsModalLikes(post) {
        detailLikeCount.textContent = post.likes;
        detailCommentCount.textContent = post.comments.length;
        
        if (post.likedByUser) {
            detailLikeBtn.classList.add('liked');
        } else {
            detailLikeBtn.classList.remove('liked');
        }
    }

    function renderComments(post) {
        if (!commentsList) return;
        commentsList.innerHTML = '';

        if (post.comments.length === 0) {
            commentsList.innerHTML = `<div class="no-comments" style="color: var(--text-muted); font-size: 0.9rem;">Nenhum comentário. Compartilhe sua opinião abaixo!</div>`;
            return;
        }

        post.comments.forEach(comment => {
            const el = document.createElement('div');
            el.className = 'comment-item';
            el.setAttribute('data-comment-id', comment.id);
            
            const isOwnComment = comment.userId === currentUserId;
            const canDelete = isOwnComment || isAdminActive;
            const canEdit = isOwnComment;

            el.innerHTML = `
                <div class="comment-meta">
                    <span class="comment-author">${comment.author} ${isOwnComment ? '(Você)' : ''}</span>
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        <span class="comment-date">${comment.date}</span>
                        <div class="comment-actions">
                            ${canEdit ? `<button class="comment-action-btn comment-edit-btn" title="Editar comentário">✏️</button>` : ''}
                            ${canDelete ? `<button class="comment-action-btn comment-delete-btn" title="Excluir comentário">🗑️</button>` : ''}
                        </div>
                    </div>
                </div>
                <div class="comment-text" id="text-${comment.id}">${comment.text}</div>
            `;

            if (canDelete) {
                const delBtn = el.querySelector('.comment-delete-btn');
                delBtn.addEventListener('click', () => {
                    deleteComment(post.id, comment.id);
                });
            }

            if (canEdit) {
                const editBtn = el.querySelector('.comment-edit-btn');
                editBtn.addEventListener('click', () => {
                    startEditComment(post.id, comment.id);
                });
            }

            commentsList.appendChild(el);
        });
    }

    // Delete comment logic
    function deleteComment(postId, commentId) {
        if (confirm("Deseja realmente excluir este comentário?")) {
            const post = posts.find(p => p.id === postId);
            if (!post) return;

            post.comments = post.comments.filter(c => c.id !== commentId);
            savePosts();
            renderComments(post);
            renderMural(); 
            updateDetailsModalLikes(post);
        }
    }

    // Start inline comment edit mode
    function startEditComment(postId, commentId) {
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        const comment = post.comments.find(c => c.id === commentId);
        if (!comment || comment.userId !== currentUserId) return;

        const textDiv = document.getElementById(`text-${commentId}`);
        if (!textDiv) return;

        textDiv.innerHTML = `
            <div class="comment-edit-form">
                <input type="text" class="comment-edit-input" value="${comment.text}" id="input-${commentId}">
                <div class="comment-edit-buttons">
                    <button class="comment-edit-btn cancel">Cancelar</button>
                    <button class="comment-edit-btn save">Salvar</button>
                </div>
            </div>
        `;

        const form = textDiv.querySelector('.comment-edit-form');
        const input = form.querySelector('.comment-edit-input');
        input.focus();

        form.querySelector('.cancel').addEventListener('click', () => {
            renderComments(post);
        });

        form.querySelector('.save').addEventListener('click', () => {
            const newText = input.value.trim();
            if (newText) {
                comment.text = newText;
                savePosts();
                renderComments(post);
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                form.querySelector('.save').click();
            } else if (e.key === 'Escape') {
                renderComments(post);
            }
        });
    }

    // Add Like from inside details modal
    if (detailLikeBtn) {
        detailLikeBtn.addEventListener('click', () => {
            if (activePostId) {
                toggleLike(activePostId);
            }
        });
    }

    // Comment submission
    if (commentForm) {
        commentForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!activePostId) return;

            const author = commentAuthorInput.value.trim();
            const text = commentTextInput.value.trim();
            const today = new Date().toLocaleDateString('pt-BR');

            // Save default commenter name in db
            db.setDefaultCommenter(author);

            const post = posts.find(p => p.id === activePostId);
            if (post) {
                const newComment = {
                    id: 'comment-' + Date.now(),
                    author: author,
                    text: text,
                    date: today,
                    userId: currentUserId 
                };
                
                post.comments.push(newComment);
                savePosts();
                renderComments(post);
                renderMural(); 
                
                detailCommentCount.textContent = post.comments.length;
                commentTextInput.value = '';
            }
        });
    }

    const closeDetailsModal = () => {
        detailsModal.classList.remove('active');
        activePostId = null;
        commentForm.reset();
        loadSavedCommenterName();
    };

    if (detailsModalClose) detailsModalClose.addEventListener('click', closeDetailsModal);
    if (detailsModal) {
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) closeDetailsModal();
        });
    }

    function loadSavedCommenterName() {
        if (commentAuthorInput) {
            commentAuthorInput.value = db.getDefaultCommenter();
        }
    }

    // Global escape key modal close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePostModal();
            closeDetailsModal();
            closeScriptureModal();
        }
    });

    // Initialize Mural
    loadPosts();
    renderMural();
    loadSavedCommenterName();

    // ==========================================================================
    // Procedural Meditative Sound Generator (Web Audio API)
    // ==========================================================================
    const ambientBtn = document.getElementById('ambient-btn');
    let audioCtx = null;
    let oscillators = [];
    let filter = null;
    let masterGain = null;
    let isPlaying = false;

    function initAudio() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        
        filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(220, audioCtx.currentTime);
        
        filter.connect(masterGain);
        masterGain.connect(audioCtx.destination);
        
        const notes = [110, 165, 220]; 
        const types = ['sine', 'sine', 'triangle'];
        const volumes = [0.3, 0.25, 0.15];
        
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            osc.type = types[index];
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            
            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(volumes[index], audioCtx.currentTime);
            
            const lfo = audioCtx.createOscillator();
            lfo.frequency.setValueAtTime(0.08 + (index * 0.02), audioCtx.currentTime);
            
            const lfoGain = audioCtx.createGain();
            lfoGain.gain.setValueAtTime(0.5 + index, audioCtx.currentTime);
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(oscGain);
            oscGain.connect(filter);
            
            osc.start();
            lfo.start();
            
            oscillators.push(osc);
            oscillators.push(lfo);
        });
    }

    function toggleAmbientSound() {
        if (!audioCtx) {
            initAudio();
        }
        
        if (isPlaying) {
            masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.5);
            ambientBtn.classList.remove('active');
            ambientBtn.title = "Ligar Som Ambiente";
            setTimeout(() => {
                if (!isPlaying && audioCtx.state === 'running') {
                    audioCtx.suspend();
                }
            }, 1500);
            isPlaying = false;
        } else {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            masterGain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
            masterGain.gain.exponentialRampToValueAtTime(0.05, audioCtx.currentTime + 2.0);
            ambientBtn.classList.add('active');
            ambientBtn.title = "Desligar Som Ambiente";
            isPlaying = true;
        }
    }

    if (ambientBtn) ambientBtn.addEventListener('click', toggleAmbientSound);
});
