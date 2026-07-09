import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const Users = React.lazy(() => import('./views/masters/users'))
const Customers = React.lazy(() => import('./views/masters/customers'))
const Parts = React.lazy(() => import('./views/masters/parts'))
const Bins = React.lazy(() => import('./views/masters/bin'))
const Transports = React.lazy(() => import('./views/masters/transport'))
const send = React.lazy(() => import('./views/transaction/send'))
const receive  = React.lazy(() => import('./views/transaction/receive')) 
const damage = React.lazy(() => import('./views/transaction/demage')) 
const scrap = React.lazy(() => import('./views/transaction/scrap')) 
const SendReport  = React.lazy(() => import('./views/transaction/sendreport')) 
const binsummary = React.lazy(() => import('./views/report/binreport')) 
const MobileSend = React.lazy(() => import('./views/mobiletransaction/mobilesend'))
const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: '/dashboard', name: 'Dashboard', element: Dashboard },
  { path: '/masters/users', name: 'User Master', element: Users },
  { path: '/masters/customers', name: 'Customer Master', element:  Customers },
  { path: '/masters/parts', name: 'Part Master', element:  Parts },
  { path: '/masters/bins', name: 'Packages Master', element:  Bins },
  { path: '/masters/transport', name: 'Transport Master', element:  Transports },
  { path: '/transaction/send', name: 'Send', element:  send },
  { path: '/transaction/receive', name: 'Receive', element:  receive },
  { path: '/transaction/damage', name: 'Damage', element:  damage },
  { path: '/transaction/scrap', name: 'Scrap', element:  scrap },
  { path: '/report/binsummary', name: 'Packages Summary', element:  binsummary },
  { path: '/send-report/:batchId', element: SendReport },
  { path: '/m/send', name: 'Send', element: MobileSend },
]

export default routes