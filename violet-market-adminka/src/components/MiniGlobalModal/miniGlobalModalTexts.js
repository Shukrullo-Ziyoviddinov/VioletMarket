export const MINI_GLOBAL_MODAL_PERMISSION = {
  deleteProduct: {
    title: "O'chirishni tasdiqlash",
    getMessage: (itemName) => `"${itemName}" mahsulotini o'chirishga aminmisiz?`,
    confirmText: 'Ha',
    cancelText: "Yo'q",
  },
  deleteSeller: {
    title: "Sotuvchini o'chirishni tasdiqlash",
    getMessage: (itemName) =>
      `Chindan ham "${itemName}" sotuvchini o'chirishga aminmisiz? Barcha mahsulotlar ham o'chadi.`,
    confirmText: 'Ha',
    cancelText: "Yo'q",
  },
  deleteCourier: {
    title: "Kuryerni o'chirishni tasdiqlash",
    getMessage: (itemName) =>
      `Chindan ham "${itemName}" kuryer akkauntini o'chirmoqchimisiz?`,
    confirmText: 'Ha',
    cancelText: "Yo'q",
  },
  removeFlashProduct: {
    title: "Katta chegirma mahsulotlari bo'limidan olib tashlashga aminmisiz?",
    getMessage: () => '',
    confirmText: 'Ha',
    cancelText: "Yo'q",
  },
  cancelOrder: {
    title: 'Buyurtmani bekor qilish',
    getMessage: () =>
      'Chindan ham buyurtmani bekor qilmoqchimisiz? (Mahsulot qayta omborga qaytariladi)',
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
