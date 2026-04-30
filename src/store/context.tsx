import { onAuthStateChanged } from "firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { auth } from "../backend/config/firebase";
import { User } from "../types";
import { appReducer, initialState } from "./reducer";
import { Action, AppState } from "./types";

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    if (!auth || !auth.onAuthStateChanged) {
      console.warn("Firebase Auth is not available. Skipping auth listener.");
      dispatch({ type: "SET_AUTH_INITIALIZED", payload: true });
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const user: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || undefined,
          emailVerified: firebaseUser.emailVerified,
          createdAt: new Date().toISOString(), // In a real app, fetch from Firestore
          photoURL: firebaseUser.photoURL || undefined,
        };
        dispatch({ type: "SET_USER", payload: user });
      } else {
        dispatch({ type: "SET_USER", payload: null });
      }
      dispatch({ type: "SET_AUTH_INITIALIZED", payload: true });
    });

    return () => unsubscribe();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
