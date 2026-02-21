import React from 'react';
import { motion } from 'framer-motion';
import UniTaskLogo, { GridMark } from './UniTaskLogo';

const LoadingLogo = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950">
            <motion.div
                className="relative"
                animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.7, 1, 0.7],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <GridMark size="xl" />
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 rounded-xl blur-2xl -z-10"
                    style={{ backgroundColor: 'rgba(91, 53, 245, 0.25)' }}
                    animate={{
                        opacity: [0.15, 0.5, 0.15],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>
            <motion.div
                className="mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
            >
                <UniTaskLogo size="sm" variant="full" hideTagline={true} />
            </motion.div>
        </div>
    );
};

export default LoadingLogo;
