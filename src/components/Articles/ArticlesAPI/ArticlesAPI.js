import axios from 'axios';

const API_URL = import.meta.env.VUE_APP_BACKEND_URL; // Adjust URL based on your backend


export const articleAPI = {
    async getArticles() {
        try {
            console.log('Sending request to:', `${API_URL}/articles`);
            const response = await axios.get(`${API_URL}/articles`);
            console.log("Get complete");
            return response.data;
        } catch (error) {
            console.error('Error fetching articles:', error);
            throw error;
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
};