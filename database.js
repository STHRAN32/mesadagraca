/**
 * Mesa da Graça - Database Layer (localStorage abstraction)
 * 
 * Este arquivo funciona como o controle do Banco de Dados local do projeto,
 * permitindo persistência de informações diretamente no navegador e facilitando
 * uma futura migração para um banco de dados real em servidor SQL/NoSQL.
 */

const db = {
    // Chaves de armazenamento
    KEYS: {
        POSTS: 'mural-posts',
        ADMIN_PASSWORD: 'admin-password',
        JOURNAL: 'devotional-journal',
        THEME: 'devotional-theme',
        USER_ID: 'devotional-user-id',
        DEFAULT_AUTHOR: 'default-author',
        DEFAULT_COMMENTER: 'default-commenter'
    },

    // ID do Usuário (Sessão anônima única)
    getUserId: function() {
        let userId = localStorage.getItem(this.KEYS.USER_ID);
        if (!userId) {
            userId = 'usr-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.KEYS.USER_ID, userId);
        }
        return userId;
    },

    // Senha do Administrador
    getAdminPassword: function() {
        let password = localStorage.getItem(this.KEYS.ADMIN_PASSWORD);
        if (!password) {
            password = 'admin'; // Senha padrão inicial
            localStorage.setItem(this.KEYS.ADMIN_PASSWORD, password);
        }
        return password;
    },

    setAdminPassword: function(newPassword) {
        if (newPassword && newPassword.trim().length > 0) {
            localStorage.setItem(this.KEYS.ADMIN_PASSWORD, newPassword.trim());
            return true;
        }
        return false;
    },

    // Preferência de Tema (Claro / Escuro)
    getTheme: function() {
        return localStorage.getItem(this.KEYS.THEME) || 'dark';
    },

    setTheme: function(theme) {
        localStorage.setItem(this.KEYS.THEME, theme);
    },

    // Diário Privado
    getJournal: function() {
        return localStorage.getItem(this.KEYS.JOURNAL) || '';
    },

    saveJournal: function(text) {
        localStorage.setItem(this.KEYS.JOURNAL, text);
    },

    clearJournal: function() {
        localStorage.removeItem(this.KEYS.JOURNAL);
    },

    // Dados de Autoria Padrão (Facilitador do formulário)
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

    // Postagens do Mural Comunitário (CRUD)
    getPosts: function(mockData) {
        const stored = localStorage.getItem(this.KEYS.POSTS);
        if (stored) {
            return JSON.parse(stored);
        } else if (mockData) {
            // Inicializa com dados falsos se não houver registros
            this.savePosts(mockData);
            return mockData;
        }
        return [];
    },

    savePosts: function(posts) {
        localStorage.setItem(this.KEYS.POSTS, JSON.stringify(posts));
    }
};
