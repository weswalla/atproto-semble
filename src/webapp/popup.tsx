import {
  ExtensionAuthProvider,
  useExtensionAuth,
} from "./hooks/useExtensionAuth";
import { SignInPage } from "./components/extension/SignInPage";
import { SaveCardPage } from "./components/extension/SaveCardPage";
import { Card, MantineProvider, ScrollArea } from "@mantine/core";
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
        <ScrollArea.Autosize w={400} mah={600}>
          <Card>
            <PopupContent />
          </Card>
        </ScrollArea.Autosize>
      </ExtensionAuthProvider>
    </MantineProvider>
  );
}

export default IndexPopup;
