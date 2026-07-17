export const MINI_GLOBAL_MODAL_PERMISSION = {
  deleteProduct: {
    title: "O'chirishni tasdiqlash",
    getMessage: () => "Chindan ham bu mahsulotni o'chirishga aminmisiz?",
    confirmText: 'Ha',
    cancelText: "Yo'q",
  },
  courierHandoff: {
    title: 'Tasdiqlash',
    getMessage: () => "Mahsulotni kuryerga topshirishni tasdiqlaysizmi?",
    confirmText: 'Ha',
    cancelText: "Yo'q",
  },
};

export function resolveMiniGlobalModalPermission(permissionKey, itemName = '') {
  const permission = MINI_GLOBAL_MODAL_PERMISSION[permissionKey];
  if (!permission) {
    return {
      title: 'Tasdiqlash',
      message: "Davom etishga aminmisiz?",
      confirmText: 'Ha',
      cancelText: "Yo'q",
    };
  }

  return {
    title: permission.title,
    message: permission.getMessage(itemName),
    confirmText: permission.confirmText,
    cancelText: permission.cancelText,
  };
}
