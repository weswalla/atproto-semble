import {
  ExtensionAuthProvider,
  useExtensionAuth,
} from "./hooks/useExtensionAuth";
import { SignInPage } from "./components/extension/SignInPage";
import { SaveCardPage } from "./components/extension/SaveCardPage";
import { Card, MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import { theme } from "@/styles/theme";

function PopupContent() {
  const { isAuthenticated } = useExtensionAuth();

  if (!isAuthenticated) {
    return <SignInPage />;
  }

  return <SaveCardPage />;
}

function IndexPopup() {
  return (
    <MantineProvider theme={theme}>
      <ExtensionAuthProvider>
        <Card w={350}>
          <PopupContent />
        </Card>
      </ExtensionAuthProvider>
    </MantineProvider>
  );
}

export default IndexPopup;
