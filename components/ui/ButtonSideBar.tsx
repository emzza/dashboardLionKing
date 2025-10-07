
import { ICONS } from '../../constants';

interface ButtonSidebarProps {
  isOpen: boolean
  onToggle: () => void
}

export function ButtonSidebar({ isOpen, onToggle }: ButtonSidebarProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        p-2 m-1 text-white md:hidden rounded-lg h-10
        bg-gray-800/80 backdrop-blur-sm border border-gray-700 
        hover:bg-gray-700/50 transition-all duration-300
        ${isOpen ? "rotate-180" : "rotate-0"}
      `}
    >
      {isOpen ? ICONS.close : ICONS.menu}
    </button>
  )
}
