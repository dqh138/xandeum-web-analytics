'use client';

import { useEffect, useState, useMemo } from 'react';
import { NodeTable } from '@/components/NodeTable';
import { fetchPNodes } from '@/lib/api';
import { Star, AlertCircle, Loader2, LayoutGrid, List, Plus, Folder, FolderOpen, MoreVertical, PenLine, Trash2, FolderPlus, X, Check } from 'lucide-react';
import { useStarredNodes } from '@/hooks/useStarredNodes';
import { useNodeUserData, NodeCollection } from '@/hooks/useNodeUserData';
import { NoDataState, EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { useSidebar } from '@/context/SidebarContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function StarredPage() {
    const [nodes, setNodes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'compare'>('list');
    const { isCollapsed } = useSidebar();

    // Data Hooks
    const { starredIds, toggleStar } = useStarredNodes();
    const {
        collections,
        aliases,
        createCollection,
        deleteCollection,
        addToCollection,
        removeFromCollection,
        setAlias,
        getAlias
    } = useNodeUserData();

    const { showToast } = useToast();

    // UI State
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    // Alias Modal
    const [editingAliasId, setEditingAliasId] = useState<string | null>(null);
    const [aliasInputValue, setAliasInputValue] = useState('');

    // Add to Collection Modal
    const [addingNodeId, setAddingNodeId] = useState<string | null>(null);

    useEffect(() => {
        const loadNodes = async () => {
            try {
                const data = await fetchPNodes();
                setNodes(data);
            } catch (err) {
                console.error('Failed to fetch nodes', err);
            } finally {
                setLoading(false);
            }
        };

        loadNodes();
    }, []);

    // Filter nodes
    const starredNodes = useMemo(() => {
        return nodes.filter(node => starredIds.includes(node.node_id));
    }, [nodes, starredIds]);

    const activeCollection = collections.find(c => c.id === activeCollectionId);

    const displayedNodes = useMemo(() => {
        if (!activeCollectionId) return starredNodes;

        const collectionNodeIds = activeCollection?.nodeIds || [];
        // Filter starred nodes that are ALSO in the collection (safety check)
        return starredNodes.filter(node => collectionNodeIds.includes(node.node_id));
    }, [starredNodes, activeCollectionId, activeCollection]);

    // Stats
    const avgScore = displayedNodes.length > 0
        ? displayedNodes.reduce((acc, curr) => acc + (curr.performance_score || 0), 0) / displayedNodes.length
        : 0;

    // Handlers
    const handleCreateCollection = () => {
        if (!newCollectionName.trim()) return;
        createCollection(newCollectionName);
        setNewCollectionName('');
        setIsCreateModalOpen(false);
    };

    const handleSaveAlias = () => {
        if (editingAliasId) {
            if (aliasInputValue.trim()) {
                setAlias(editingAliasId, aliasInputValue);
            } else {
                // Remove alias if empty
                // But normally we might want a remove button. 
                // Let's assume empty string means remove for now or just update.
                // Better UI would be explicit remove.
                if (getAlias(editingAliasId)) {
                    // If it had an alias, and we save empty, maybe we shouldn't do anything or remove it?
                    // generic setAlias will set it directly.
                    setAlias(editingAliasId, aliasInputValue);
                }
            }
            setEditingAliasId(null);
            setAliasInputValue('');
        }
    };

    const toggleNodeInCollection = (collectionId: string, nodeId: string) => {
        const collection = collections.find(c => c.id === collectionId);
        if (!collection) return;

        if (collection.nodeIds.includes(nodeId)) {
            removeFromCollection(collectionId, nodeId);
        } else {
            addToCollection(collectionId, nodeId);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-slate-900">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <main className={cn(
            "min-h-screen p-6 md:p-12 flex flex-col md:flex-row gap-8 transition-all duration-300 bg-slate-950",
            isCollapsed ? "lg:pl-28" : "lg:pl-72"
        )}>

            {/* Sidebar / Collections List */}
            <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                        <FolderOpen className="text-blue-400" /> Collections
                    </h2>

                    <div className="space-y-1">
                        <button
                            onClick={() => setActiveCollectionId(null)}
                            className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${activeCollectionId === null
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <span className="font-medium">All Starred</span>
                            <span className="bg-black/20 px-2 py-0.5 rounded text-xs">
                                {starredNodes.length}
                            </span>
                        </button>

                        {collections.map(collection => (
                            <div key={collection.id} className="relative group">
                                <button
                                    onClick={() => setActiveCollectionId(collection.id)}
                                    className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${activeCollectionId === collection.id
                                        ? 'bg-blue-600 text-white shadow-lg'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <span className="font-medium truncate max-w-[120px]">{collection.name}</span>
                                    <span className="bg-black/20 px-2 py-0.5 rounded text-xs">
                                        {collection.nodeIds.length}
                                    </span>
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete collection "${collection.name}"?`)) {
                                            deleteCollection(collection.id);
                                            if (activeCollectionId === collection.id) setActiveCollectionId(null);
                                        }
                                    }}
                                    className="absolute right-12 top-1/2 -translate-y-1/2 p-1.5 text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Delete Collection"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="w-full mt-4 flex items-center justify-center gap-2 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-500 hover:border-slate-500 hover:text-slate-700 dark:text-slate-300 transition-colors"
                        >
                            <Plus size={16} /> New Collection
                        </button>
                    </div>
                </div>
            </aside>


            {/* Main Content */}
            <div className="flex-1 space-y-8">
                {/* Header */}
                <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center border-b border-slate-200 dark:border-slate-800 pb-6">
                    <div>
                        <h1 className="flex items-center gap-3 text-3xl font-bold text-slate-900 dark:text-white">
                            {activeCollectionId ? (
                                <>
                                    <Folder className="text-blue-500" />
                                    {activeCollection?.name}
                                </>
                            ) : (
                                <>
                                    <Star className="text-yellow-500 fill-yellow-500" />
                                    All Starred Nodes
                                </>
                            )}
                        </h1>
                        <p className="mt-2 text-slate-600 dark:text-slate-600 dark:text-slate-400">
                            {activeCollectionId ? 'Manage nodes in this specific collection.' : 'Monitor and compare your favorite network nodes.'}
                        </p>
                    </div>

                    {displayedNodes.length > 0 && (
                        <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 p-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-white'
                                    }`}
                            >
                                <List size={16} /> List
                            </button>
                            <button
                                onClick={() => setViewMode('compare')}
                                className={`flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'compare' ? 'bg-slate-700 text-white' : 'text-slate-600 dark:text-slate-400 hover:text-white'
                                    }`}
                            >
                                <LayoutGrid size={16} /> Compare
                            </button>
                        </div>
                    )}
                </header>

                {/* Stats */}
                {displayedNodes.length > 0 && (
                    <div className="grid gap-6 sm:grid-cols-3">
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-600 dark:text-slate-400">Nodes</h3>
                            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{displayedNodes.length}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-600 dark:text-slate-400">Avg Performance</h3>
                            <p className="mt-2 text-3xl font-bold text-emerald-400">{avgScore.toFixed(2)}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900/50 p-6">
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-600 dark:text-slate-400">Online Status</h3>
                            <p className="mt-2 text-3xl font-bold text-blue-400">
                                {displayedNodes.filter(n => n.status === 'online').length}/{displayedNodes.length}
                            </p>
                        </div>
                    </div>
                )}

                {/* Node List/Grid */}
                {displayedNodes.length === 0 ? (
                    <EmptyState
                        icon={Star}
                        title={activeCollectionId ? "This collection is empty" : "No starred nodes yet"}
                        message={activeCollectionId ? "Add nodes from the 'All Starred' view using the folder icon." : "Go to the Leaderboard to find nodes to track."}
                    />
                ) : (
                    <>
                        {viewMode === 'list' ? (
                            <NodeTable nodes={displayedNodes} />
                        ) : (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {displayedNodes.map(node => {
                                    const alias = getAlias(node.node_id);

                                    return (
                                        <div key={node.node_id} className="relative rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-800/50 p-6 transition-all hover:border-slate-600 group">

                                            <div className="absolute right-4 top-4 flex gap-2">
                                                {/* Alias Button */}
                                                <button
                                                    onClick={() => {
                                                        setEditingAliasId(node.node_id);
                                                        setAliasInputValue(alias || '');
                                                    }}
                                                    className="p-1.5 text-slate-600 dark:text-slate-600 dark:text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit Alias"
                                                >
                                                    <PenLine size={16} />
                                                </button>

                                                {/* Collections Button */}
                                                <button
                                                    onClick={() => setAddingNodeId(node.node_id)}
                                                    className="p-1.5 text-slate-600 dark:text-slate-600 dark:text-slate-500 hover:text-blue-400 hover:bg-slate-700/50 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Add to Collection"
                                                >
                                                    <FolderPlus size={16} />
                                                </button>

                                                <button
                                                    onClick={() => toggleStar(node.node_id)}
                                                    className="text-yellow-500 hover:text-yellow-600 p-1.5"
                                                    title="Unstar"
                                                >
                                                    <Star className="fill-yellow-500" size={20} />
                                                </button>
                                            </div>

                                            <h3 className="pr-20 text-lg font-bold text-slate-900 dark:text-white truncate" title={node.node_id}>
                                                {alias ? (
                                                    <span className="text-blue-200">{alias}</span>
                                                ) : (
                                                    <span className="font-mono">{node.node_id}</span>
                                                )}
                                            </h3>
                                            {alias && <p className="text-xs font-mono text-slate-600 dark:text-slate-600 dark:text-slate-500 mb-2">{node.node_id}</p>}


                                            <div className="mt-4 space-y-4">
                                                {/* Quick Actions for collections tags could go here */}
                                                <div className="flex flex-wrap gap-1">
                                                    {collections.filter(c => c.nodeIds.includes(node.node_id)).map(c => (
                                                        <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-800/50">
                                                            {c.name}
                                                        </span>
                                                    ))}
                                                </div>

                                                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                                    <span className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">Status</span>
                                                    <span className={`text-sm font-medium ${node.status === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {node.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-b border-slate-700/50 pb-2">
                                                    <span className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">Score</span>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{(node.performance_score || 0).toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between pt-1">
                                                    <span className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">Address</span>
                                                    <span className="text-xs font-mono text-slate-600 dark:text-slate-600 dark:text-slate-500 truncate max-w-[150px]">{node.address}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}

            {/* Create Collection Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                title="Create New Collection"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-600 dark:text-slate-400 mb-1">Collection Name</label>
                        <input
                            type="text"
                            className="w-full rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. Asia Nodes"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setIsCreateModalOpen(false)}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateCollection}
                            className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            Create
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Alias Modal */}
            <Modal
                isOpen={!!editingAliasId}
                onClose={() => setEditingAliasId(null)}
                title="Set Node Alias"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">
                        Give this node a friendly name to make it easier to identify.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 dark:text-slate-600 dark:text-slate-400 mb-1">Alias Name</label>
                        <input
                            type="text"
                            className="w-full rounded bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                            placeholder="e.g. My Primary Validator"
                            value={aliasInputValue}
                            onChange={(e) => setAliasInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveAlias()}
                            autoFocus
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            onClick={() => setEditingAliasId(null)}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveAlias}
                            className="bg-blue-600 hover:bg-blue-500 text-slate-900 dark:text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                            Save Alias
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Add to Collection Modal */}
            <Modal
                isOpen={!!addingNodeId}
                onClose={() => setAddingNodeId(null)}
                title="Manage Collections"
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400">
                        Select collections for this node:
                    </p>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {collections.length === 0 && (
                            <p className="text-sm text-slate-600 dark:text-slate-600 dark:text-slate-500 italic">No collections created yet.</p>
                        )}

                        {collections.map(col => {
                            const isIncluded = addingNodeId ? col.nodeIds.includes(addingNodeId) : false;
                            return (
                                <button
                                    key={col.id}
                                    onClick={() => addingNodeId && toggleNodeInCollection(col.id, addingNodeId)}
                                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${isIncluded
                                        ? 'bg-blue-900/20 border-blue-500/50'
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                                        }`}
                                >
                                    <span className="text-sm text-slate-900 dark:text-white font-medium">{col.name}</span>
                                    {isIncluded && <Check className="text-blue-400" size={16} />}
                                </button>
                            );
                        })}
                    </div>

                    {collections.length === 0 && (
                        <button
                            onClick={() => {
                                setAddingNodeId(null);
                                setIsCreateModalOpen(true);
                            }}
                            className="text-sm text-blue-400 hover:underline"
                        >
                            Create a collection first
                        </button>
                    )}

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => setAddingNodeId(null)}
                            className="px-4 py-2 text-sm text-slate-600 dark:text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-white"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </Modal>

        </main>
    );
}
