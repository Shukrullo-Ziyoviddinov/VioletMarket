import { createContext, useContext } from 'react';

const GlobalLoaderContext = createContext({
  setGlobalLoading: () => {},
});

export function useGlobalLoader() {
  return useContext(GlobalLoaderContext);
}

export default GlobalLoaderContext;
