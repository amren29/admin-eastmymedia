"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";

interface ModalData {
  title: string;
  message: string;
  type: "success" | "danger" | "warning" | "info";
}

interface ModalState extends ModalData {
  isOpen: boolean;
  isConfirm: boolean;
  onConfirm?: () => void;
}

interface ModalContextType {
  showModal: (data: ModalData) => void;
  showAlert: (
    title: string,
    message: string,
    type?: "success" | "danger" | "warning" | "info"
  ) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void,
    type?: "success" | "danger" | "warning" | "info"
  ) => void;
}

const ModalContext = createContext<ModalContextType>({
  showModal: () => {},
  showAlert: () => {},
  showConfirm: () => {},
});

const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; button: string }> = {
  success: {
    bg: "bg-green-50",
    border: "border-green-500",
    text: "text-green-800",
    button: "bg-green-600 hover:bg-green-700",
  },
  danger: {
    bg: "bg-red-50",
    border: "border-red-500",
    text: "text-red-800",
    button: "bg-red-600 hover:bg-red-700",
  },
  warning: {
    bg: "bg-yellow-50",
    border: "border-yellow-500",
    text: "text-yellow-800",
    button: "bg-yellow-600 hover:bg-yellow-700",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-500",
    text: "text-blue-800",
    button: "bg-blue-600 hover:bg-blue-700",
  },
};

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    isConfirm: false,
    title: "",
    message: "",
    type: "info",
  });

  const closeModal = useCallback(() => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const showModal = useCallback((data: ModalData) => {
    setModal({
      isOpen: true,
      isConfirm: false,
      ...data,
    });
  }, []);

  const showAlert = useCallback(
    (
      title: string,
      message: string,
      type: "success" | "danger" | "warning" | "info" = "info"
    ) => {
      setModal({
        isOpen: true,
        isConfirm: false,
        title,
        message,
        type,
      });
    },
    []
  );

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      type: "success" | "danger" | "warning" | "info" = "warning"
    ) => {
      setModal({
        isOpen: true,
        isConfirm: true,
        title,
        message,
        type,
        onConfirm,
      });
    },
    []
  );

  const handleConfirm = () => {
    modal.onConfirm?.();
    closeModal();
  };

  const colors = TYPE_COLORS[modal.type] || TYPE_COLORS.info;

  return (
    <ModalContext.Provider value={{ showModal, showAlert, showConfirm }}>
      {children}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          />
          <div
            className={`relative z-10 w-full max-w-md rounded-lg border-l-4 bg-white p-6 shadow-xl ${colors.border}`}
          >
            <h3 className={`mb-2 text-lg font-semibold ${colors.text}`}>
              {modal.title}
            </h3>
            <p className="mb-6 text-gray-600">{modal.message}</p>
            <div className="flex justify-end gap-3">
              {modal.isConfirm && (
                <button
                  onClick={closeModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={modal.isConfirm ? handleConfirm : closeModal}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${colors.button}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  return useContext(ModalContext);
}
