import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL + '/api/auth/';
axios.defaults.withCredentials = true;
const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);
    return response.data;
};
const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    if (response.data) {
        sessionStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
};
const getAllUsers = async () => {
    const response = await axios.get(API_URL + 'users', { withCredentials: true });
    return response.data;
};
const logout = async () => {
    try {
        await axios.post(API_URL + 'logout');
        sessionStorage.removeItem('user');
        localStorage.removeItem('user');
    } catch (error) {
        console.error("Logout failed", error);
    }
};
const authService = {
    register,
    logout,
    login,
    getAllUsers,
};
export default authService;
