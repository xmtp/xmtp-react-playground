import LoginView from "./views/LoginView";
import { useClient } from "./hooks/useClient";
import HomeView from "./views/HomeView";
import ConversationProvider from "./contexts/ConversationContext";

function App() {
  const client = useClient();

  return client ? (
    <ConversationProvider>
      <HomeView />
    </ConversationProvider>
  ) : (
    <LoginView />
  );
}

export default App;
