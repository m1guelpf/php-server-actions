import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import laravel from 'laravel-vite-plugin'
import serverActions from './actions-plugin'

export default defineConfig({
	plugins: [laravel({ refresh: true, input: 'resources/js/app.tsx' }), react(), serverActions()],
})
