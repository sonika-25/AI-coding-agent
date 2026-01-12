import axios from 'axios'

const api = axios.create({
    baseURL: '<put your backend here>',
})

export default api;