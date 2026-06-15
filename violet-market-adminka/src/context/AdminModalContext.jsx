import { createContext, useContext } from 'react';

const AdminModalContext = createContext({
  openAdminModal: () => {},
  closeAdminModal: () => {},
});

export function useAdminModal() {
  return useContext(AdminModalContext);
}

export default AdminModalContext;
