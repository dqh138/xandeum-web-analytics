import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

const STORAGE_KEY = 'xandeum_starred_nodes';
const EVENT_KEY = 'starred-nodes-updated';

export function useStarredNodes() {
    const [starredIds, setStarredIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { showToast } = useToast();

    const loadFromStorage = useCallback(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setStarredIds(JSON.parse(stored));
            } else {
                setStarredIds([]);
            }
        } catch (error) {
            console.error('Failed to load starred nodes:', error);
        }
    }, []);

    // Initial load and event listener
    useEffect(() => {
        loadFromStorage();
        setIsLoaded(true);

        const handleStorageChange = () => {
            loadFromStorage();
        };

        window.addEventListener(EVENT_KEY, handleStorageChange);
        return () => window.removeEventListener(EVENT_KEY, handleStorageChange);
    }, [loadFromStorage]);

    const toggleStar = (nodeId: string) => {
        let newIds: string[] = [];
        let isAdded = false;

        setStarredIds(prev => {
            const isStarred = prev.includes(nodeId);
            if (isStarred) {
                newIds = prev.filter(id => id !== nodeId);
                isAdded = false;
            } else {
                newIds = [...prev, nodeId];
                isAdded = true;
            }

            // Save immediately and dispatch event
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds));
            window.dispatchEvent(new Event(EVENT_KEY));

            // Show toast
            if (isAdded) {
                showToast(`Node ${nodeId.slice(0, 8)}... added to Starred`, 'success');
            } else {
                showToast(`Node ${nodeId.slice(0, 8)}... removed from Starred`, 'info');
            }

            return newIds;
        });
    };

    const isStarred = (nodeId: string) => starredIds.includes(nodeId);

    return { starredIds, toggleStar, isStarred };
}
