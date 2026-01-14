import React from 'react';
import { motion } from 'framer-motion';
import { Hexagon } from 'lucide-react';

const LoadingLogo = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-slate-950">
            <motion.div
                className="relative"
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 1, 0.5],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <div className="bg-indigo-600 p-4 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none">
                    <Hexagon className="w-12 h-12 text-white fill-indigo-600" strokeWidth={1.5} />
                </div>
                {/* Glow effect */}
                <motion.div
                    className="absolute inset-0 bg-indigo-500 rounded-xl blur-xl -z-10"
                    animate={{
                        opacity: [0.2, 0.6, 0.2],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </motion.div>
            <motion.p
                className="mt-6 text-indigo-600 dark:text-indigo-400 font-medium tracking-wide text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                UNITY
            </motion.p>
        </div>
    );
};

export default LoadingLogo;
