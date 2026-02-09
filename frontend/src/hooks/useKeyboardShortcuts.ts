'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export const useKeyboardShortcuts = () => {
    const router = useRouter();
    const { theme, setTheme } = useTheme();
    const [lastKeyPressed, setLastKeyPressed] = useState<string | null>(null);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts if user is typing in an input or textarea
            const target = event.target as HTMLElement;
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const key = event.key.toLowerCase();

            // Navigation shortcuts (G + key)
            if (lastKeyPressed === 'g') {
                switch (key) {
                    case 'd':
                        router.push('/dashboard');
                        break;
                    case 'h':
                        router.push('/homework');
                        break;
                    case 'a':
                        router.push('/analytics');
                        break;
                    case 'q':
                        router.push('/questionbank');
                        break;
                    case 'm':
                        router.push('/mockexams');
                        break;
                    case 'f':
                        router.push('/flashcards');
                        break;
                    case 'n':
                        router.push('/notifications');
                        break;
                    case 'p':
                        router.push('/profile');
                        break;
                }
                setLastKeyPressed(null);
                return;
            }

            // Single key shortcuts
            switch (key) {
                case 't':
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    break;
                case 'g':
                    setLastKeyPressed('g');
                    // Clear 'g' after 1 second if no follow-up key is pressed
                    setTimeout(() => setLastKeyPressed(null), 1000);
                    break;
                case '?':
                    // Show help modal (could be implemented later)
                    console.log('Show keyboard shortcuts help');
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [lastKeyPressed, router, theme, setTheme]);

    return { lastKeyPressed };
};
