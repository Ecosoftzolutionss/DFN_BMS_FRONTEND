// src/menuConfig.js
import {
  cilSpeedometer,
  cilUser,
  cilPeople,
  cilList,
  cilStorage,
  cilTruck,
  cilArrowTop,
  cilArrowBottom,
  cilWarning,
  cilTrash,
  cilChart
} from '@coreui/icons'

export const MENU_CONFIG = [
  {
    group: 'Main',
    items: [
      { name: 'Dashboard', icon: cilSpeedometer }
    ]
  },
  {
    group: 'Masters',
    items: [
      { name: 'User', icon: cilUser },
      { name: 'Customer', icon: cilPeople },
      { name: 'Part', icon: cilList },
      { name: 'Packages', icon: cilStorage },
      { name: 'Transport', icon: cilTruck }
    ]
  },
  {
    group: 'Transaction',
    items: [
      { name: 'Send', icon: cilArrowTop },
      { name: 'Receive', icon: cilArrowBottom },
      { name: 'Damage', icon: cilWarning },
      { name: 'Scrap', icon: cilTrash }
    ]
  },
  {
    group: 'Reports',
    items: [
      { name: 'Packages Summary', icon: cilChart }
    ]
  }
]