"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Modal, ModalType } from '@/components/ui/Modal';

interface ModalOptions {
    title: string;
    message: string;
    type?: ModalType;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    showConfirm: (title: string, message: string, onConfirm: () => void, type?: ModalType) => void;
    showAlert: (title: string, message: string, type?: ModalType) => void;
    closeModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalProps, setModalProps] = useState<ModalOptions>({
        title: '',
        message: '',
        type: 'info'
    });

    const showModal = useCallback((options: ModalOptions) => {
        setModalProps(options);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    const showConfirm = useCallback((title: string, message: string, onConfirm: () => void, type: ModalType = 'confirm') => {
        showModal({
            title,
            message,
            type,
            confirmText: type === 'danger' ? 'Delete' : 'Confirm',
            cancelText: 'Cancel',
            onConfirm
        });
    }, [showModal]);

    const showAlert = useCallback((title: string, message: string, type: ModalType = 'info') => {
        showModal({
            title,
            message,
            type,
            confirmText: 'OK'
        });
    }, [showModal]);

    return (
        <ModalContext.Provider value={{ showModal, showConfirm, showAlert, closeModal }}>
            {children}
            <Modal
                isOpen={isOpen}
                onClose={closeModal}
                {...modalProps}
            />
        </ModalContext.Provider>
    );
}

export const useModal = () => {
    const context = useContext(ModalContext);
    if (context === undefined) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};
