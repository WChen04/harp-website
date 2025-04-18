import axios from 'axios';

const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://harp-research/api' 
  : 'http://localhost:3000'; // Adjust URL based on your backend

export const articleAPI = {
    async getArticles() {
        try {
            const response = await axios.get(`${API_URL}/articles`);
            return response.data;
        } catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
        }
    },
    async addArticle(articleData, token) {
        try {
            const response = await axios.post(`${API_URL}/admin/articles/add`, articleData, {
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
            const response = await axios.get(`${API_URL}/articles/${articleId}/image`, {
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
            console.log('Sending request for Top Stories to:', `${API_URL}/articles/top`);
            const response = await axios.get(`${API_URL}/articles/top`);
            console.log("Get TopStories Completed");
            return response.data;
        } catch (error) {
            console.error('Error fetching Top Stories:', error);
            throw error;
        }
    },

    async searchArticles(query) {
        try {
            const response = await axios.get(`${API_URL}/articles/search`, {
                params: { query }
            });
            return response.data;
        } catch (error) {
            console.error('Error searching articles:', error);
            throw error;
        }
    }
}