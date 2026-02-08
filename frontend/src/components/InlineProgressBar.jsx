import React, { useState, useRef, useEffect } from 'react';
import { useOptimisticUpdate } from '../hooks/useOptimisticUpdate';
import { cn } from '../lib/utils'; // Assuming cn utility exists

const InlineProgressBar = ({ progress, onUpdate, readOnly = false }) => {
    const optimistic = useOptimisticUpdate(progress || 0, onUpdate);
    const [isDragging, setIsDragging] = useState(false);
    const progressBarRef = useRef(null);

    // Shake animation class on error
    const shakeClass = optimistic.isError ? "animate-shake ring-2 ring-red-500 ring-offset-1" : "";

    const handleMouseDown = (e) => {
        if (readOnly) return;
        setIsDragging(true);
        updateProgressFromEvent(e);
    };

    const updateProgressFromEvent = (e) => {
        if (!progressBarRef.current) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;

        let newProgress = Math.round((x / width) * 100);
        newProgress = Math.max(0, Math.min(100, newProgress));

        // Update local state instantly (Optimistic)
        optimistic.setValue(newProgress);
    };

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isDragging) {
                updateProgressFromEvent(e);
            }
        };

        const handleMouseUp = (e) => {
            if (isDragging) {
                setIsDragging(false);
                // Commit the change on mouse up
                optimistic.update(optimistic.value);
            }
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, optimistic.value]); // Add dependencies

    return (
        <div
            className={cn("flex items-center gap-2 w-full max-w-[140px] group", shakeClass)}
            onClick={(e) => e.stopPropagation()} // Prevent row click
        >
            <div
                ref={progressBarRef}
                className={cn(
                    "relative flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden transition-all",
                    !readOnly && "cursor-pointer hover:h-2.5"
                )}
                onMouseDown={handleMouseDown}
            >
                {/* Foreground Bar */}
                <div
                    className={cn(
                        "absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-75", // Fast duration for drag
                        optimistic.isPending && "opacity-80"
                    )}
                    style={{ width: `${optimistic.value}%` }}
                />
            </div>
            <span className={cn(
                "text-xs font-medium w-8 text-right text-slate-600 dark:text-slate-400 tabular-nums",
                optimistic.isPending && "text-indigo-500"
            )}>
                {optimistic.value}%
            </span>
        </div>
    );
};

export default React.memo(InlineProgressBar);
