import { useRouter } from 'next/router';
import type { NavigationItem } from '@/types/navigation';

interface NavItemProps {
  item: NavigationItem;
  level?: number;
}

export function NavItem({ item, level = 0 }: NavItemProps) {
  const router = useRouter();
  const Icon = item.icon;
  
  const isActive = router.pathname === item.path || 
                  router.pathname.startsWith(`${item.path}/`);

  const handleClick = () => {
    router.push(item.path);
  };

  return (
    <div className={level > 0 ? 'ml-4' : ''}>
      <button
        onClick={handleClick}
        className={`
          w-full flex items-center px-4 py-2 text-sm font-medium rounded-lg
          transition-colors duration-200
          ${isActive
            ? 'bg-indigo-50 text-indigo-600'
            : 'text-gray-600 hover:bg-gray-50'
          }
        `}
      >
        <Icon className="mr-3 h-5 w-5" />
        <span className="flex-1 text-left">{item.name}</span>
      </button>

      {item.children && (
        <div className="mt-1 space-y-1">
          {item.children.map((child) => (
            <NavItem
              key={child.path}
              item={child}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}