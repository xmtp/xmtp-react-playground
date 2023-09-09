import { Link } from "react-router-dom";
import ConversationListView from "./ConversationListView";

export default function SidebarView() {
  return (
    <aside className="xs:w-full md:w-[290px] h-full xs:px-5 md:p-0 flex flex-col overflow-visible transition-all duration-500">
      {/* <FadeTransition>
      <component :is="ActiveComponent" class="h-full flex flex-col" />
    </FadeTransition> */}

      <span>Here are your conversations:</span>
      <Link to="new" className="text-blue-700">
        Make a new one
      </Link>
      <ConversationListView />
    </aside>
  );
}
