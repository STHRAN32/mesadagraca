/**
 * Mesa da Graça - Database Layer (localStorage & Firebase Firestore Hybrid)
 * 
 * Este arquivo abstrai as operações de persistência. Se o Firebase estiver configurado,
 * as postagens, comentários e a senha do admin serão sincronizados em tempo real na nuvem.
 * Caso contrário, o sistema continuará rodando localmente (localStorage) sem quebrar.
 */

// ==========================================================================
// CONFIGURAÇÃO DO BANCO DE DADOS CLOUD (FIREBASE)
// ==========================================================================
// Quando você criar seu projeto no Firebase Console, copie as credenciais da Web App
// e cole-as no objeto abaixo. Mude "isFirebaseConfigured" para true.
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_AUTH_DOMAIN",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_STORAGE_BUCKET",
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",
    appId: "SEU_APP_ID"
};

const isFirebaseConfigured = false; // Mude para true depois de colar suas chaves acima

// ==========================================================================
// INICIALIZAÇÃO E ABSTRAÇÃO DO BANCO
// ==========================================================================
let firestore = null;

if (isFirebaseConfigured && typeof firebase !== 'undefined') {
    try {
        firebase.initializeApp(firebaseConfig);
        firestore = firebase.firestore();
        console.log("🔥 Banco de dados em nuvem (Firebase Firestore) conectado!");
    } catch (e) {
        console.error("Falha ao inicializar o Firebase. Rodando em modo local.", e);
        firestore = null;
    }
}

const db = {
    // Chaves de armazenamento local (fallback)
    KEYS: {
        POSTS: 'mural-posts',
        ADMIN_PASSWORD: 'admin-password',
        JOURNAL: 'devotional-journal',
        THEME: 'devotional-theme',
        USER_ID: 'devotional-user-id',
        DEFAULT_AUTHOR: 'default-author',
        DEFAULT_COMMENTER: 'default-commenter',
        LIKED_POSTS: 'liked-posts-list' // Lista de IDs das postagens que este dispositivo curtiu
    },

    // Cache local da senha do administrador
    cachedAdminPassword: 'admin',

    isCloudActive: function() {
        return firestore !== null;
    },

    // ID do Usuário (Local)
    getUserId: function() {
        let userId = localStorage.getItem(this.KEYS.USER_ID);
        if (!userId) {
            userId = 'usr-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.KEYS.USER_ID, userId);
        }
        return userId;
    },

    // Inicialização da senha do admin
    initAdminPassword: function() {
        this.cachedAdminPassword = localStorage.getItem(this.KEYS.ADMIN_PASSWORD) || 'admin';
        
        if (this.isCloudActive()) {
            // Escuta a senha do admin em tempo real da nuvem
            firestore.collection('config').doc('admin').onSnapshot(doc => {
                if (doc.exists && doc.data().password) {
                    this.cachedAdminPassword = doc.data().password;
                    localStorage.setItem(this.KEYS.ADMIN_PASSWORD, this.cachedAdminPassword);
                } else {
                    // Se o documento não existir na nuvem, cria com a senha atual
                    firestore.collection('config').doc('admin').set({
                        password: this.cachedAdminPassword
                    }).catch(err => console.error("Erro ao registrar senha padrão na nuvem", err));
                }
            }, err => {
                console.warn("Sem permissões ou erro ao ler configurações na nuvem, usando cache local.", err);
            });
        }
    },

    getAdminPassword: function() {
        return this.cachedAdminPassword;
    },

    setAdminPassword: function(newPassword) {
        if (!newPassword || newPassword.trim().length === 0) return false;
        
        const pwd = newPassword.trim();
        this.cachedAdminPassword = pwd;
        localStorage.setItem(this.KEYS.ADMIN_PASSWORD, pwd);

        if (this.isCloudActive()) {
            firestore.collection('config').doc('admin').set({
                password: pwd
            }).then(() => {
                console.log("Senha do administrador atualizada na nuvem.");
            }).catch(err => {
                console.error("Erro ao salvar senha na nuvem:", err);
            });
        }
        return true;
    },

    // Controle Local de Curtidas (Impede likes múltiplos do mesmo dispositivo)
    getLikedPosts: function() {
        const list = localStorage.getItem(this.KEYS.LIKED_POSTS);
        return list ? JSON.parse(list) : [];
    },

    toggleLikedPostLocal: function(postId) {
        let list = this.getLikedPosts();
        const index = list.indexOf(postId);
        let status = false;

        if (index > -1) {
            list.splice(index, 1); // remove
            status = false;
        } else {
            list.push(postId); // adiciona
            status = true;
        }
        localStorage.setItem(this.KEYS.LIKED_POSTS, JSON.stringify(list));
        return status; // Retorna true se adicionou curtida, false se removeu
    },

    // Preferência de Tema (Local)
    getTheme: function() {
        return localStorage.getItem(this.KEYS.THEME) || 'dark';
    },

    setTheme: function(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    // Diário Privado (Local)
    getJournal: function() {
        return localStorage.getItem(this.KEYS.JOURNAL) || '';
    },

    saveJournal: function(text) {
        localStorage.setItem(this.KEYS.JOURNAL, text);
    },

    clearJournal: function() {
        localStorage.removeItem(this.KEYS.JOURNAL);
    },

    // Destaque de Autoria Padrão (Local)
    getDefaultAuthor: function() {
        return localStorage.getItem(this.KEYS.DEFAULT_AUTHOR) || '';
    },

    setDefaultAuthor: function(name) {
        localStorage.setItem(this.KEYS.DEFAULT_AUTHOR, name);
    },

    getDefaultCommenter: function() {
        return localStorage.getItem(this.KEYS.DEFAULT_COMMENTER) || '';
    },

    setDefaultCommenter: function(name) {
        localStorage.setItem(this.KEYS.DEFAULT_COMMENTER, name);
    },

    // ==========================================================================
    // ESCUTA DE MURAL EM TEMPO REAL (MURAL SYNC)
    // ==========================================================================
    subscribePosts: function(callback, mockData) {
        if (this.isCloudActive()) {
            // Ouvinte em tempo real do Firestore
            return firestore.collection('posts')
                .orderBy('createdAt', 'desc')
                .onSnapshot(snapshot => {
                    let postsList = [];
                    snapshot.forEach(doc => {
                        postsList.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });

                    if (postsList.length === 0 && mockData) {
                        // Semeia o banco em nuvem se estiver vazio
                        console.log("Semeando postagens padrões na nuvem...");
                        mockData.forEach(post => {
                            const newPost = { ...post };
                            delete newPost.id; // deixa o Firestore gerar o ID
                            newPost.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                            firestore.collection('posts').add(newPost);
                        });
                    } else {
                        // Retorna os posts atualizados
                        callback(postsList);
                    }
                }, error => {
                    console.error("Erro na escuta em tempo real do Firestore:", error);
                    // Fallback para local
                    callback(this.getLocalPosts(mockData));
                });
        } else {
            // Modo local: envia imediatamente e simula evento
            callback(this.getLocalPosts(mockData));
            return null; // Sem listener ativo
        }
    },

    getLocalPosts: function(mockData) {
        const stored = localStorage.getItem(this.KEYS.POSTS);
        if (stored) {
            return JSON.parse(stored);
        } else if (mockData) {
            localStorage.setItem(this.KEYS.POSTS, JSON.stringify(mockData));
            return mockData;
        }
        return [];
    },

    // Salvar Postagem (Adição ou Edição)
    addPost: async function(post) {
        if (this.isCloudActive()) {
            const newPost = { ...post };
            delete newPost.id;
            newPost.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await firestore.collection('posts').add(newPost);
        } else {
            const posts = this.getLocalPosts();
            posts.unshift(post);
            localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
        }
    },

    updatePost: async function(id, updatedPost) {
        if (this.isCloudActive()) {
            // Remove dados não editáveis e atualiza
            const dataToUpdate = {
                title: updatedPost.title,
                author: updatedPost.author,
                content: updatedPost.content,
                date: updatedPost.date
            };
            await firestore.collection('posts').doc(id).update(dataToUpdate);
        } else {
            const posts = this.getLocalPosts();
            const idx = posts.findIndex(p => p.id === id);
            if (idx > -1) {
                posts[idx].title = updatedPost.title;
                posts[idx].author = updatedPost.author;
                posts[idx].content = updatedPost.content;
                posts[idx].date = updatedPost.date;
                localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
            }
        }
    },

    deletePost: async function(id) {
        if (this.isCloudActive()) {
            await firestore.collection('posts').doc(id).delete();
        } else {
            let posts = this.getLocalPosts();
            posts = posts.filter(p => p.id !== id);
            localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
        }
    },

    // Curtir Postagem na Nuvem
    likePost: async function(id) {
        const isAdded = this.toggleLikedPostLocal(id);
        const increment = isAdded ? 1 : -1;

        if (this.isCloudActive()) {
            await firestore.collection('posts').doc(id).update({
                likes: firebase.firestore.FieldValue.increment(increment)
            });
        } else {
            const posts = this.getLocalPosts();
            const idx = posts.findIndex(p => p.id === id);
            if (idx > -1) {
                posts[idx].likes = Math.max(0, posts[idx].likes + increment);
                localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
            }
        }
    },

    // Comentários da Postagem (Cloud)
    saveComments: async function(postId, comments) {
        if (this.isCloudActive()) {
            await firestore.collection('posts').doc(postId).update({
                comments: comments
            });
        } else {
            const posts = this.getLocalPosts();
            const idx = posts.findIndex(p => p.id === postId);
            if (idx > -1) {
                posts[idx].comments = comments;
                localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
            }
        }
    }
};

// Inicializa a senha do admin e vincula escuta à nuvem se disponível
db.initAdminPassword();
