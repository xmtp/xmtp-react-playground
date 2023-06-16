import "./polyfills";
import "./index.css";
import "@animxyz/core";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import ClientProvider from "./contexts/ClientContext.tsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { findConversation } from "./model/conversations";
import ConversationViewWithLoader from "./views/ConversationViewWithLoader.tsx";
import NewConversationView from "./views/NewConversationView.tsx";

async function conversationLoader({ params }: any) {
  const conversation = await findConversation(params.conversationTopic);
  return { conversation };
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
    },
    {
      path: "c/:conversationTopic",
      element: <ConversationViewWithLoader />,
      loader: conversationLoader,
    },
    {
      path: "new",
      element: <NewConversationView />,
    },
  ],
  { basename: import.meta.env.DEV ? "" : "/xmtp-quickstart-react" }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ClientProvider>
      <RouterProvider router={router} />
    </ClientProvider>
  </React.StrictMode>
);
