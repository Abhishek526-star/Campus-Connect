import { useNavigate } from 'react-router';
import { Bell, LogOut, UserCircle } from 'lucide-react';
import { DropdownMenu, MenuItem } from '../ui/DropdownMenu.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { useLogoutMutation } from '../../services/authApi.js';

/** User avatar menu — profile, notifications, logout. */
export function UserMenu() {
  const navigate = useNavigate();
  const [logout] = useLogoutMutation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <DropdownMenu
      label="Account menu"
      trigger={<Avatar src={undefined} name="Account" size="sm" />}
    >
      <MenuItem icon={UserCircle} onClick={() => navigate('/profile')}>
        My Profile
      </MenuItem>
      <MenuItem icon={Bell} onClick={() => navigate('/notifications')}>
        Notifications
      </MenuItem>
      <div className="my-1 border-t border-slate-100" />
      <MenuItem icon={LogOut} destructive onClick={handleLogout}>
        Log out
      </MenuItem>
    </DropdownMenu>
  );
}
