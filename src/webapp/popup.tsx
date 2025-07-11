import { ExtensionAuthProvider, useExtensionAuth } from "./hooks/useExtensionAuth";
import { SignInPage } from "./components/extension/SignInPage";
import { SaveCardPage } from "./components/extension/SaveCardPage";
import "./app/globals.css";

function PopupContent() {
  const { isAuthenticated } = useExtensionAuth();
  
  if (!isAuthenticated) {
    return <SignInPage />;
  }
  
  return <SaveCardPage />;
}

function IndexPopup() {
  return (
    <ExtensionAuthProvider>
      <PopupContent />
    </ExtensionAuthProvider>
  );
}

export default IndexPopup;
