import { useUserStore } from '@/store/user.store';
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
            
            // ↑ getState() = accès au store hors composant React
            useUserStore.getState().logout()

            //si en gros on recoit une reponse 401 on redirige automatiquement vers la page de login

            window.location.href='/login'
        }
        return Promise.reject(error)
    }
);