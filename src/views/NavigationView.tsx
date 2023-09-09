import { useSetClient } from "../hooks/useClient";
import { useSetTheme } from "../hooks/useTheme";
import Logo from "./Logo";
import { SunIcon } from "@heroicons/react/20/solid";
import { useDisconnect } from "wagmi";

export default function NavigationView() {
  const { disconnectAsync } = useDisconnect();
  const setClient = useSetClient();
  async function logout() {
    await disconnectAsync();
    indexedDB.deleteDatabase("DB");
    localStorage.removeItem("_insecurePrivateKey");
    setClient(null);
  }

  return (
    <div className="xs:w-full md:w-11 md:h-full md:py-7 xs:py-5 px-5 flex xs:flex-row md:flex-col items-center transition-all duration-500">
      <Logo />

      {/* <!--main navigation--> */}
      <div className="grow">
        <nav aria-label="Main navigation">
          <ul className="xs:flex md:block xs:justify-between xs:items-center">
            {/* <!--message button--> */}
            <li>
              {/* <NavLink
              :icon="ChatBubbleOvalLeftIcon"
              title="Conversations"
              @click="() => handleActiveSidebarComponentChange('messages')"
              :active="store.activeSidebarComponent === 'messages'"
            /> */}
            </li>

            {/* <!--settings button small screen--> */}
            <li className="xs:inline md:hidden">
              {/* <NavLink
              :icon="Cog6ToothIcon"
              title="Settings"
              @click="() => handleActiveSidebarComponentChange('settings')"
              :active="store.activeSidebarComponent === 'settings'"
            /> */}
            </li>
          </ul>
        </nav>
      </div>

      {/* <!--secondary navigation--> */}
      <div>
        <nav aria-label="Extra navigation" className="xs:hidden md:block">
          <ul>
            {/* <!--toggle dark mode button--> */}
            <li>
              <SunIcon
                type="button"
                onClick={useSetTheme()}
                className="opacity-40 cursor-pointer"
              />

              {/* <NavLink
              :icon="store.settings.darkMode ? SunIcon : MoonIcon"
              title="Night mode"
              @click="store.settings.darkMode = !store.settings.darkMode"
            /> */}
            </li>
            {/* <!--settings button--> */}
            <li>
              {/* <NavLink
              :icon="Cog6ToothIcon"
              title="Settings"
              @click="() => handleActiveSidebarComponentChange('settings')"
              :active="store.activeSidebarComponent === 'settings'"
            /> */}
            </li>
            <li>
              <button onClick={logout}>Logout</button>
            </li>
          </ul>
        </nav>

        {/* <!--separator--> */}
        <hr className="xs:hidden md:block mb-6 border-gray-100 dark:border-gray-600" />

        {/* <!--user avatar--> */}
        {/* <AccountDropdown
        id="profile-menu"
        class="xs:hidden md:block"
        aria-labelledby="profile-menu-button"
        :show-dropdown="showDropdown"
        :handle-show-dropdown="() => (showDropdown = true)"
        :handle-close-dropdown="() => (showDropdown = false)"
      /> */}
      </div>
    </div>
  );
}
