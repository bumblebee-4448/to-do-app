import { Moon, Sun } from 'lucide-react';
import { Button } from './Button';
import { useThemeStore } from '../../stores/themeStore';

export const ThemeToggle = () => {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const Icon = theme === 'light' ? Moon : Sun;

  return (
    <Button
      variant="ghost"
      size="icon"
      className="icon-btn dashboard-theme-btn"
      onClick={toggleTheme}
      aria-label="Chuyển đổi giao diện sáng/tối"
    >
      <Icon aria-hidden="true" size={18} />
    </Button>
  );
};
