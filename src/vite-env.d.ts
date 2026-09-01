/// <reference types="vite/client" />

// типы переменных окружения из .env и .env.local
// без этого файла import.meta.env.VITE_* имеет тип any,
// и опечатка в имени переменной проходит молча
interface ImportMetaEnv {
    readonly VITE_BASE_URL: string
    readonly VITE_API_KEY: string
    readonly VITE_ACCESS_TOKEN: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
