'use client';

import React from 'react';
import { AlertTriangle, X, RefreshCw, Trash2, GitMerge, CheckCircle2 } from 'lucide-react';

type ConfirmModalProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
    loadingText?: string;
    icon?: 'trash' | 'merge' | 'warning';
};

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'warning',
    isLoading = false,
    loadingText = 'Processing...',
    icon = 'warning'
}: ConfirmModalProps) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-red-100',
            iconColor: 'text-red-600',
            buttonBg: 'bg-red-600 hover:bg-red-700',
            buttonShadow: 'shadow-red-500/20'
        },
        warning: {
            iconBg: 'bg-yellow-100',
            iconColor: 'text-yellow-600',
            buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
            buttonShadow: 'shadow-yellow-500/20'
        },
        info: {
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            buttonBg: 'bg-indigo-600 hover:bg-indigo-700',
            buttonShadow: 'shadow-indigo-500/20'
        }
    };

    const styles = variantStyles[variant];

    const IconComponent = {
        trash: Trash2,
        merge: GitMerge,
        warning: AlertTriangle
    }[icon];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
                onClick={!isLoading ? onClose : undefined}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up overflow-hidden">
                {/* Loading Overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-fade-in">
                        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                        <p className="text-gray-700 font-medium">{loadingText}</p>
                        <p className="text-gray-400 text-sm mt-1">Please wait...</p>
                    </div>
                )}

                {/* Close Button */}
                {!isLoading && (
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                )}

                {/* Content */}
                <div className="p-6 pt-8">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${styles.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent className={`w-7 h-7 ${styles.iconColor}`} />
                    </div>

                    {/* Title & Message */}
                    <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
                        <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 btn btn-secondary py-3 disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 btn py-3 text-white ${styles.buttonBg} shadow-lg ${styles.buttonShadow} disabled:opacity-50`}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    {loadingText}
                                </>
                            ) : (
                                confirmText
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
