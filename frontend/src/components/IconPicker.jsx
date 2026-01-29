import React from 'react';
import * as LucideIcons from 'lucide-react';

// List of professional icons for projects
const ICON_LIST = [
    'Folder', 'Briefcase', 'Target', 'Rocket', 'Star', 'Zap', 'Flame',
    'Lightbulb', 'Palette', 'Trophy', 'Layout', 'Settings', 'Users',
    'Globe', 'Database', 'Cloud', 'Server', 'Code', 'Smartphone',
    'Monitor', 'Printer', 'ShoppingBag', 'CreditCard', 'DollarSign',
    'BarChart', 'PieChart', 'Activity', 'Calendar', 'Clock', 'Bell',
    'Lock', 'Key', 'Shield', 'FileText', 'Book', 'Music', 'Video',
    'Image', 'Map', 'Compass', 'Anchor', 'Flag', 'Home', 'Building'
];

export const DynamicIcon = ({ name, size = 24, className = "", ...props }) => {
    // Unified fallback for legacy placeholders
    const iconName = (!name || name === '??') ? 'Folder' : name;

    // Check if it's an emoji or Lucide icon
    const IconComponent = LucideIcons[iconName];

    if (!IconComponent) {
        // Fallback: render as text (for existing emojis)
        return <span className={`text-[${size}px] ${className} flex items-center justify-center`} style={{ fontSize: size }}>{iconName}</span>;
    }

    return <IconComponent size={size} className={className} {...props} />;
};

export const IconPicker = ({ selectedIcon, onSelectIcon }) => {
    const [activeTab, setActiveTab] = React.useState('all');

    const categories = {
        all: ICON_LIST,
        business: ['Briefcase', 'Target', 'Trophy', 'Users', 'Building', 'DollarSign', 'CreditCard'],
        tech: ['Code', 'Database', 'Cloud', 'Server', 'Smartphone', 'Monitor', 'Globe'],
        design: ['Palette', 'Layout', 'Image', 'Video', 'Music', 'Map', 'Compass'],
        productivity: ['Folder', 'FileText', 'Calendar', 'Clock', 'Bell', 'CheckSquare', 'List']
    };

    const tabs = [
        { id: 'all', label: 'Tümü' },
        { id: 'business', label: 'İş' },
        { id: 'tech', label: 'Teknoloji' },
        { id: 'design', label: 'Tasarım' },
        { id: 'productivity', label: 'Üretkenlik' }
    ];

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
            {/* Tabs */}
            <div className="flex overflow-x-auto bg-gray-50 border-b border-gray-200 scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[80px] px-3 py-2 text-xs font-medium transition-colors whitespace-nowrap
              ${activeTab === tab.id
                                ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Icon Grid */}
            <div className="p-3 bg-white h-48 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-8 gap-2">
                    {(categories[activeTab] || ICON_LIST).map(iconName => {
                        // Only show icons that actually exist in the full list to avoid empty spots if category has extras
                        if (!ICON_LIST.includes(iconName) && activeTab !== 'all') return null;

                        return (
                            <button
                                key={iconName}
                                type="button"
                                onClick={() => onSelectIcon(iconName)}
                                className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:scale-110 hover:bg-gray-100 text-gray-600
                  ${selectedIcon === iconName ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-500 scale-105' : ''}
                `}
                                title={iconName}
                            >
                                <DynamicIcon name={iconName} size={20} />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
