// src/shared/lib/toast.ts
import { toast } from 'react-toastify';

// theme отдельно не передаём: ToastContainer в App.tsx уже задаёт theme="colored" глобально
export const errorToast = (message: string) => toast.error(message);
export const successToast = (message: string) => toast.success(message);
