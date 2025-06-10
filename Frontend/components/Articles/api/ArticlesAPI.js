import axios from 'axios';

const API_URL = 'http://localhost:3000'; // Adjust URL based on your backend

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
    },
    async deleteArticle(id) {
        return fetch(`${API_URL}/articles/${id}`, {
            method: 'DELETE',
        });
    },
    async toggleTopStory(id){
        const response = await axios.patch(`${API_URL}/articles/${id}/toggle-top`)
        if (response.status !== 200) {
            throw new Error('Failed to toggle top story');
        }

        return response.data;
    }
}