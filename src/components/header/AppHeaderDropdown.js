import {
  CAvatar,
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CContainer
} from '@coreui/react'
import { cilLockLocked, cilUser } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { useNavigate } from 'react-router-dom';
import React from 'react'

const AppHeaderDropdown = () => {
  const navigate = useNavigate();


  const user = JSON.parse(sessionStorage.getItem('user') || 'null');

const handleLogout = () => {
  sessionStorage.removeItem('user');
  window.dispatchEvent(new Event('storage'));
  navigate('/login', { replace: true });
}

  return (
    
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar size="md" style={{ background: '#e4e6ef' }}>
          <CIcon icon={cilUser} size="lg" />
        </CAvatar>
      </CDropdownToggle>

      <CDropdownMenu className="pt-0" placement="bottom-end">
        <CDropdownHeader className="bg-body-secondary fw-semibold mb-2">
          {user?.username}
        </CDropdownHeader>

        <CDropdownDivider />

        <CDropdownItem onClick={handleLogout}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Logout
        </CDropdownItem>
      </CDropdownMenu>

       
    </CDropdown>

    
  )
}

export default AppHeaderDropdown