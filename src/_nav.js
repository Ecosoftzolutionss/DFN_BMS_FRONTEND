import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilSpeedometer,
  cilSettings,
  cilSync,
  cilChartPie,
  cilUser,
  cilPeople,
  cilLibrary,
  cilInbox,
  cilTruck,
  cilArrowTop,
  cilArrowBottom,
  cilWarning,
  cilTrash
} from '@coreui/icons'

import { CNavGroup, CNavItem } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
  },

  {
    component: CNavGroup,
    name: 'Masters',
    icon: <CIcon icon={cilSettings} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'User',
        to: '/masters/users',
        icon: <CIcon icon={cilUser} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Customer',
        to: '/masters/customers',
        icon: <CIcon icon={cilPeople} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Part',
        to: '/masters/parts',
        icon: <CIcon icon={cilLibrary} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Packages',
        to: '/masters/bins',
        icon: <CIcon icon={cilInbox} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Transport',
        to: '/masters/transport',
        icon: <CIcon icon={cilTruck} customClassName="nav-icon" />,
      },
    ],
  },

  {
    component: CNavGroup,
    name: 'Transaction',
    icon: <CIcon icon={cilSync} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Send',
        to: '/transaction/send',
        icon: <CIcon icon={cilArrowTop} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Receive',
        to: '/transaction/receive',
        icon: <CIcon icon={cilArrowBottom} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Damage',
        to: '/transaction/damage',
        icon: <CIcon icon={cilWarning} customClassName="nav-icon" />,
      },
      {
        component: CNavItem,
        name: 'Scrap',
        to: '/transaction/scrap',
        icon: <CIcon icon={cilTrash} customClassName="nav-icon" />,
      },
    ],
  },

  {
    component: CNavGroup,
    name: 'Reports',
    icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Packages Summary',
        to: '/report/binsummary',
        icon: <CIcon icon={cilChartPie} customClassName="nav-icon" />,
      },
    ],
  },
]

export default _nav