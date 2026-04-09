import axios from 'axios'

export const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
    headers:{
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// interceptor auth
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if(error.response?.status === 401){
            // ce qu'il faut faire
        }
        return Promise.reject(error)
    }
);