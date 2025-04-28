import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '';

export const articleAPI = {
    async getArticles() {
        try {
            const response = await axios.get(`${baseURL}/articles`);
            return response.data;
        } catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
        }
    },
    async addArticle(articleData, token) {
        try {
            const response = await axios.post(`${baseURL}/admin/articles/add`, articleData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${token}` // if you're using token auth
                }
            });
            return response.data;
        } catch (error) {
            console.error('Detailed error adding article:', error.response?.data || error.message);
            throw error;
        }
    },
    async getArticleImage(articleId) {
        try {
            const response = await axios.get(`${baseURL}/articles/${articleId}/image`, {
                responseType: 'blob'
            });
            return URL.createObjectURL(response.data);
        } catch (error) {
            console.error('Error retrieving article image:', error);
            return null;
        }
    },
    async getTopStories() {
        try {
            console.log('Sending request for Top Stories to:', `${baseURL}/articles/top`);
            const response = await axios.get(`${baseURL}/articles/top`);
            console.log("Get TopStories Completed");
            return response.data;
        } catch (error) {
            console.error('Error fetching Top Stories:', error);
            throw error;
        }
    },

    async searchArticles(query) {
        try {
            const response = await axios.get(`${baseURL}/articles/search`, {
                params: { query }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching articles:', error);
            throw error;
        }
    }
}