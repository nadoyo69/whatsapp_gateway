import Swal from 'sweetalert2';

// Base customized SweetAlert instance with Dark / NexforgexGateway styling
const customSwal = Swal.mixin({
  background: '#111b21',
  color: '#e9edef',
  backdrop: 'rgba(11, 20, 26, 0.8)',
  customClass: {
    popup: 'border border-[#2a3942] rounded-3xl shadow-2xl p-6 font-["Plus_Jakarta_Sans",sans-serif]',
    title: 'text-lg font-bold text-white',
    htmlContainer: 'text-xs text-slate-300',
    confirmButton: 'px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition mx-1.5 cursor-pointer',
    cancelButton: 'px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition mx-1.5 cursor-pointer',
    denyButton: 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition mx-1.5 cursor-pointer'
  },
  buttonsStyling: false
});

// Toast mixin for lightweight corner alerts
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  background: '#111b21',
  color: '#e9edef',
  customClass: {
    popup: 'border border-[#2a3942] rounded-2xl shadow-xl p-4 flex items-center font-["Plus_Jakarta_Sans",sans-serif]'
  },
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showSuccess = (title = 'Success!', text = '') => {
  return customSwal.fire({
    icon: 'success',
    title,
    text,
    iconColor: '#22c55e'
  });
};

export const showError = (title = 'Error', text = '') => {
  return customSwal.fire({
    icon: 'error',
    title,
    text,
    iconColor: '#ef4444'
  });
};

export const showWarning = (title = 'Warning', text = '') => {
  return customSwal.fire({
    icon: 'warning',
    title,
    text,
    iconColor: '#f59e0b'
  });
};

export const showInfo = (title = 'Notice', text = '') => {
  return customSwal.fire({
    icon: 'info',
    title,
    text,
    iconColor: '#3b82f6'
  });
};

export const confirmDialog = async (title = 'Are you sure?', text = '', confirmButtonText = 'Yes, proceed', isDanger = false) => {
  const result = await customSwal.fire({
    title,
    text,
    icon: isDanger ? 'warning' : 'question',
    iconColor: isDanger ? '#ef4444' : '#3b82f6',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    customClass: {
      popup: 'border border-[#2a3942] rounded-3xl shadow-2xl p-6 font-["Plus_Jakarta_Sans",sans-serif]',
      title: 'text-lg font-bold text-white',
      htmlContainer: 'text-xs text-slate-300',
      confirmButton: isDanger 
        ? 'px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition mx-1.5 cursor-pointer'
        : 'px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition mx-1.5 cursor-pointer',
      cancelButton: 'px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition mx-1.5 cursor-pointer'
    }
  });

  return result.isConfirmed;
};

export const toastSuccess = (title = 'Success') => {
  return Toast.fire({
    icon: 'success',
    title,
    iconColor: '#22c55e'
  });
};

export const toastError = (title = 'Error') => {
  return Toast.fire({
    icon: 'error',
    title,
    iconColor: '#ef4444'
  });
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  confirmDialog,
  toastSuccess,
  toastError
};
