"use client";
import { useState, useCallback } from "react";

export const useToast = () => {
  const [toast, setToast] = useState({
    message: "",
    type: "info",
    visible: false
  });

  const showToast = useCallback((message, type = "info", duration = 5000) => {
    setToast({
      message,
      type,
      visible: true
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, visible: false }));
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showToast(message, "success", duration);
  }, [showToast]);

  const showError = useCallback((message, duration) => {
    showToast(message, "error", duration);
  }, [showToast]);

  const showWarning = useCallback((message, duration) => {
    showToast(message, "warning", duration);
  }, [showToast]);

  const showInfo = useCallback((message, duration) => {
    showToast(message, "info", duration);
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};