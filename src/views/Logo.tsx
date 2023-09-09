import lightLogo from "../assets/vectors/logo.svg";
import darkLogo from "../assets/vectors/logo.svg";
import { useTheme } from "../hooks/useTheme";

export default function Logo() {
  const theme = useTheme();
  return (
    <div className="mb-7 h-7 xs:hidden md:block">
      <button aria-label="avian logo" className="outline-none">
        {theme == "dark" ? (
          <img src={lightLogo} className="w-8 h-7" alt="gray bird logo" />
        ) : (
          <img
            src={darkLogo}
            className="w-8 h-7 opacity-40"
            alt="white bird logo"
          />
        )}
      </button>
    </div>
  );
}
