import React, { Suspense, useState, useEffect } from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { CSpinner } from '@coreui/react';
import './scss/style.scss';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './scss/examples.scss';

// Lazy Load
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'));
const Login = React.lazy(() => import('./views/pages/login/Login'));
const MobileSend = React.lazy(() => import('./views/mobiletransaction/mobilesend'));
const SendReport = React.lazy(() => import('./views/transaction/sendreport'));

const App = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    const storedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
    setUser(storedUser);

    // listen for login/logout
    const handleStorage = () => {
      const updatedUser = JSON.parse(sessionStorage.getItem('user') || 'null');
      setUser(updatedUser);
    };

    window.addEventListener('storage', handleStorage);

    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAuth = !!user;
  const isMobile = user && !user.mobilityWithoutCheck;

  return (
    <HashRouter>
      <ToastContainer position="top-right" autoClose={3000} />
      <Suspense
        fallback={
          <div className="pt-3 text-center">
            <CSpinner color="primary" variant="grow" />
          </div>
        }
      >
        <Routes>
          <Route
            path="/"
            element={
              isAuth
                ? isMobile
                  ? <Navigate to="/m/send" replace />
                  : <Navigate to="/dashboard" replace />
                : <Navigate to="/login" replace />
            }
          />
          <Route
            path="/login"
            element={!isAuth ? <Login /> : <Navigate to="/" replace />}
          />
          <Route path="/send-report/:batchId" element={<SendReport />} />
          <Route
            path="/m/send"
            element={isAuth ? <MobileSend /> : <Navigate to="/login" />}
          />
          <Route
            path="/*"
            element={isAuth ? <DefaultLayout /> : <Navigate to="/login" />}
          />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default App;