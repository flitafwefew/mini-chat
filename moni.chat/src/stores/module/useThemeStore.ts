import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'

interface ThemeState {
    theme: Theme
}

export const useThemeStore = defineStore('theme', {
    state: (): ThemeState => ({
        theme: 'light',
    }),
    actions: {
        async setTheme(newTheme: Theme) {
            this.theme = newTheme
            document.documentElement.setAttribute('data-theme', newTheme)
        },
    },
    persist: true,
})