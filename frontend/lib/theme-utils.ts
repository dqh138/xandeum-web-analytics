// Utility function to generate consistent page layout classes
export function getPageLayoutClasses(isCollapsed: boolean): string {
    return `min-h-screen p-6 md:p-12 transition-all duration-300 bg-gray-50 dark:bg-slate-950 ${isCollapsed ? 'lg:pl-28' : 'lg:pl-72'
        }`;
}

// Utility for card backgrounds
export function getCardClasses(): string {
    return 'rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 backdrop-blur-sm';
}

// Utility for text colors
export function getTextClasses(variant: 'primary' | 'secondary' | 'muted' = 'primary'): string {
    const variants = {
        primary: 'text-slate-900 dark:text-white',
        secondary: 'text-slate-700 dark:text-slate-300',
        muted: 'text-slate-500 dark:text-slate-400',
    };
    return variants[variant];
}