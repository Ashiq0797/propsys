import axios from 'axios'

export const CURRENT_TENANT_ID = 1

export const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
})

export function errorMessage(err) {
  if (err?.response?.data?.error) return err.response.data.error
  if (err?.message) return err.message
  return 'Something went wrong'
}
