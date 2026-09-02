import { defineConfig } from '@hey-api/openapi-ts'

export default defineConfig({
    input: './api-json',
    output: './api-generated',
    plugins: ['@hey-api/typescript'],
})
