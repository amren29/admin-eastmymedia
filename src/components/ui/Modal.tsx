import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

export type ModalType = 'info' | 'success' | 'warning' | 'danger' | 'confirm';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="h-6 w-6 text-green-600" />;
            case 'warning': return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
            case 'danger': return <AlertTriangle className="h-6 w-6 text-red-600" />;
            case 'confirm': return <HelpCircle className="h-6 w-6 text-blue-600" />;
            default: return <Info className="h-6 w-6 text-blue-600" />;
        }
    };

    const getHeaderColor = () => {
        switch (type) {
            case 'success': return 'bg-green-50';
            case 'warning': return 'bg-yellow-50';
            case 'danger': return 'bg-red-50';
            default: return 'bg-slate-50';
        }
    };

    const getConfirmButtonColor = () => {
        switch (type) {
            case 'success': return 'bg-green-600 hover:bg-green-700 focus:ring-green-500';
            case 'warning': return 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500';
            case 'danger': return 'bg-red-600 hover:bg-red-700 focus:ring-red-500';
            default: return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-slate-900/50 transition-opacity backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Modal Panel */}
            <div
                ref={modalRef}
                className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-slate-200"
            >
                <div className={`px-4 pb-4 pt-5 sm:p-6 sm:pb-4 ${getHeaderColor()}`}>
                    <div className="sm:flex sm:items-start">
                        <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:h-10 sm:w-10 ring-1 ring-inset ring-slate-200`}>
                            {getIcon()}
                        </div>
                        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                            <h3 className="text-base font-semibold leading-6 text-slate-900" id="modal-title">
                                {title}
                            </h3>
                            <div className="mt-2">
                                <p className="text-sm text-slate-500 whitespace-pre-wrap">
                                    {message}
                                </p>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 text-slate-400 hover:text-slate-500"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="bg-white px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-slate-100">
                    {(type === 'confirm' || type === 'danger' || type === 'warning') && onConfirm ? (
                        <>
                            <button
                                type="button"
                                className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonColor()}`}
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                            >
                                {confirmText}
                            </button>
                            <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 sm:mt-0 sm:w-auto transition-colors"
                                onClick={onClose}
                            >
                                {cancelText}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm sm:ml-3 sm:w-auto transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${getConfirmButtonColor()}`}
                            onClick={onClose}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
