import React from 'react'
import { useSelector, useDispatch, } from 'react-redux'
import {
  CCloseButton, CSidebar, CSidebarBrand, CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilChevronLeft, cilChevronRight } from '@coreui/icons'
import { AppSidebarNav } from './AppSidebarNav'
import logo from '../assets/images/Sidebarss.png'
import usePrivilege from '../../src/views/hooks/usePrivilege'

import navigation from '../_nav'
const AppSidebar = () => {
  const dispatch = useDispatch()
  const unfoldable = useSelector((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.sidebarShow)
  const { canView } = usePrivilege()

  const filteredNav = navigation
    .map(item => {
      if (item.name === 'Dashboard') {
        return canView('Dashboard') ? item : null
      }
      if (item.items) {
        const filteredItems = item.items.filter(sub =>
          canView(sub.name)
        )
        if (filteredItems.length === 0) return null
        return {
          ...item,
          items: filteredItems
        }
      }

      return null
    })
    .filter(Boolean)

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch({ type: 'set', sidebarShow: visible })
      }}
    >
      <CSidebarHeader className="border-bottom">
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '-12px',
            zIndex: 1000
          }}
        >
        </div>
        <CSidebarBrand to="/" className="d-flex align-items-center gap-2 px-2" style={{ textDecoration: 'none' }}>
          <img src={logo} alt="BMS" height="35" />
          <div className="text-white">
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>BMS</div>
            <div style={{ fontSize: '14px' }}>Bin Management System</div>
          </div>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          dark
          onClick={() => dispatch({ type: 'set', sidebarShow: false })}
        />
      </CSidebarHeader>


      <AppSidebarNav items={filteredNav} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler
          onClick={() => dispatch({ type: 'set', sidebarUnfoldable: !unfoldable })}
        />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
