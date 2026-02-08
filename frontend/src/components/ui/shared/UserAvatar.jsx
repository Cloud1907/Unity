import React from 'react';
import { getAvatarUrl, getInitials, getUserColor } from '../../../utils/avatarHelper';
import { cn } from '../../../lib/utils';

/**
 * Shared User Avatar Component
 * Handles:
 * 1. Image URL validation
 * 2. Fallback to Initials + Background Color
 * 3. Tooltip (Title)
 * 4. ID Normalization (Handles objects like {userId: 1} or raw IDs)
 */
const UserAvatar = ({
    user,
    userId,
    usersList = [], // Context users list for lookup if only ID is passed
    size = 'md',   // sm: 20px (w-5), md: 32px (w-8), lg: 40px (w-10)
    className,
    showTooltip = true
}) => {

    // -- 1. Data Normalization Strategy --
    // We determine the "User Object" either from direct prop or by lookup
    let finalUser = user;

    if (!finalUser && userId && usersList.length > 0) {
        // Handle "Complex ID" case (e.g. assignee object {userId: 1})
        const validId = typeof userId === 'object' ? (userId.userId || userId.id) : userId;
        finalUser = usersList.find(u => u.id === validId);
    }

    // Fallback if still not found
    if (!finalUser) {
        finalUser = {
            fullName: 'Bilinmeyen Kullanıcı',
            avatar: null,
            color: '#cbd5e1' // slate-300
        };
    }

    // -- 2. Size Mapping --
    const sizeClasses = {
        xs: "w-4 h-4 text-[8px]",
        sm: "w-5 h-5 text-[9px]",
        md: "w-8 h-8 text-xs",
        lg: "w-10 h-10 text-sm"
    };

    const containerSize = sizeClasses[size] || sizeClasses.md;

    // -- 3. Render --
    return (
        <div
            title={showTooltip ? finalUser.fullName : undefined}
            className={cn(
                "rounded-full border border-white dark:border-slate-800 overflow-hidden shadow-sm bg-white shrink-0 flex items-center justify-center relative",
                containerSize,
                className
            )}
        >
            {getAvatarUrl(finalUser.avatar) ? (
                <img
                    src={getAvatarUrl(finalUser.avatar)}
                    alt={finalUser.fullName}
                    className="w-full h-full object-cover"
                />
            ) : (
                <div
                    className="w-full h-full flex items-center justify-center text-white uppercase"
                    style={{ backgroundColor: getUserColor(finalUser) }}
                >
                    {getInitials(finalUser.fullName)}
                </div>
            )}
        </div>
    );
};

export default React.memo(UserAvatar);
