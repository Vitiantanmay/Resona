import React from 'react';
import type { ContextMenuData } from '../types';

interface ContextMenuProps {
    menuData: ContextMenuData;
    onClose: () => void;
    onDelete: (id: string, type: 'component' | 'wire') => void;
    onDuplicate: (id: string) => void;
    onShowProperties: (id: string) => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ menuData, onClose, onDelete, onDuplicate, onShowProperties }) => {
    if (!menuData.visible) {
        return null;
    }

    const handleDelete = () => {
        if (menuData.targetId && (menuData.targetType === 'component' || menuData.targetType === 'wire')) {
            onDelete(menuData.targetId, menuData.targetType);
        }
        onClose();
    };

    const handleDuplicate = () => {
        if (menuData.targetId && menuData.targetType === 'component') {
            onDuplicate(menuData.targetId);
        }
        onClose();
    };

    const handleShowProperties = () => {
        if (menuData.targetId && menuData.targetType === 'component') {
            onShowProperties(menuData.targetId);
        }
        onClose();
    };
    
    const isComponent = menuData.targetType === 'component';

    return (
        <div 
            style={{ top: menuData.y, left: menuData.x }} 
            className="fixed z-50 w-48 bg-white/50 dark:bg-gray-800/50 backdrop-blur-lg rounded-xl shadow-2xl border border-black/5 dark:border-white/5 p-1.5 animate-fade-in"
        >
            <ul className="text-sm">
                {(menuData.targetType === 'component' || menuData.targetType === 'wire') && (
                     <li 
                        onClick={handleDelete}
                        className="px-3 py-1.5 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors duration-150 cursor-pointer"
                    >
                        Delete {menuData.targetType === 'component' ? 'Component' : 'Wire'}
                    </li>
                )}
                <li
                    onClick={isComponent ? handleShowProperties : undefined}
                    className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${isComponent ? 'hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' : 'text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                >
                    Properties
                </li>
                <li
                    onClick={isComponent ? handleDuplicate : undefined}
                    className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${isComponent ? 'hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer' : 'text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                >
                    Duplicate
                </li>
            </ul>
        </div>
    );
};

export default ContextMenu;
