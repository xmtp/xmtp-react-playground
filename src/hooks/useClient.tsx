import { useContext } from "react";
import { ClientContext } from "../contexts/ClientContext";

export function useClient() {
  return useContext(ClientContext).client;
}

export function useSetClient() {
  return useContext(ClientContext).setClient;
}
