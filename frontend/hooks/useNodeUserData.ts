'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/Toast';

const STORAGE_KEYS = {
    ALIASES: 'xandeum_node_aliases',
    COLLECTIONS: 'xandeum_node_collections',
};

const EVENTS = {
    ALIASES: 'node-aliases-updated',
    COLLECTIONS: 'node-collections-updated',
};

export interface NodeCollection {
    id: string;
    name: string;
    nodeIds: string[];
    description?: string;
    color?: string; // For future usage
}

export type NodeAliases = Record<string, string>;

export function useNodeUserData() {
    const [aliases, setAliases] = useState<NodeAliases>({});
    const [collections, setCollections] = useState<NodeCollection[]>([]);
    const { showToast } = useToast();

    // Load Data
    const loadData = useCallback(() => {
        try {
            const storedAliases = localStorage.getItem(STORAGE_KEYS.ALIASES);
            const storedCollections = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);

            setAliases(storedAliases ? JSON.parse(storedAliases) : {});
            setCollections(storedCollections ? JSON.parse(storedCollections) : []);
        } catch (error) {
            console.error('Failed to load user data:', error);
        }
    }, []);

    useEffect(() => {
        loadData();

        const handleAliasChange = () => loadData();
        const handleCollectionChange = () => loadData();

        window.addEventListener(EVENTS.ALIASES, handleAliasChange);
        window.addEventListener(EVENTS.COLLECTIONS, handleCollectionChange);

        return () => {
            window.removeEventListener(EVENTS.ALIASES, handleAliasChange);
            window.removeEventListener(EVENTS.COLLECTIONS, handleCollectionChange);
        };
    }, [loadData]);

    // --- Alias Actions ---

    const setAlias = (nodeId: string, alias: string) => {
        setAliases(prev => {
            const next = { ...prev, [nodeId]: alias };
            localStorage.setItem(STORAGE_KEYS.ALIASES, JSON.stringify(next));
            window.dispatchEvent(new Event(EVENTS.ALIASES));
            showToast(`Alias set for node ${nodeId.slice(0, 8)}...`, 'success');
            return next;
        });
    };

    const removeAlias = (nodeId: string) => {
        setAliases(prev => {
            const next = { ...prev };
            delete next[nodeId];
            localStorage.setItem(STORAGE_KEYS.ALIASES, JSON.stringify(next));
            window.dispatchEvent(new Event(EVENTS.ALIASES));
            showToast('Alias removed', 'info');
            return next;
        });
    };

    const getAlias = (nodeId: string) => aliases[nodeId] || null;

    // --- Collection Actions ---

    const createCollection = (name: string, description?: string) => {
        const newCollection: NodeCollection = {
            id: crypto.randomUUID(),
            name,
            description,
            nodeIds: [],
        };

        setCollections(prev => {
            const next = [...prev, newCollection];
            localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(next));
            window.dispatchEvent(new Event(EVENTS.COLLECTIONS));
            showToast(`Collection "${name}" created`, 'success');
            return next;
        });
    };

    const deleteCollection = (id: string) => {
        setCollections(prev => {
            const next = prev.filter(c => c.id !== id);
            localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(next));
            window.dispatchEvent(new Event(EVENTS.COLLECTIONS));
            showToast('Collection deleted', 'info');
            return next;
        });
    };

    const addToCollection = (collectionId: string, nodeId: string) => {
        setCollections(prev => {
            const next = prev.map(c => {
                if (c.id === collectionId && !c.nodeIds.includes(nodeId)) {
                    return { ...c, nodeIds: [...c.nodeIds, nodeId] };
                }
                return c;
            });
            localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(next));
            window.dispatchEvent(new Event(EVENTS.COLLECTIONS));
            showToast('Node added to collection', 'success');
            return next;
        });
    };

    const removeFromCollection = (collectionId: string, nodeId: string) => {
        setCollections(prev => {
            const next = prev.map(c => {
                if (c.id === collectionId) {
                    return { ...c, nodeIds: c.nodeIds.filter(id => id !== nodeId) };
                }
                return c;
            });
            localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(next));
            window.dispatchEvent(new Event(EVENTS.COLLECTIONS));
            showToast('Node removed from collection', 'info');
            return next;
        });
    };

    return {
        aliases,
        collections,
        setAlias,
        removeAlias,
        getAlias,
        createCollection,
        deleteCollection,
        addToCollection,
        removeFromCollection,
    };
}
