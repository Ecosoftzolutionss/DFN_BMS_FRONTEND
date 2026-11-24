import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  CButton,
  CCol,
  CContainer,
  CForm,
  CFormInput,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilUser } from '@coreui/icons'
import './Login.css'
import logo from '../../../assets/images/Comlogo.png'
import scanImg from '../../../assets/images/scanandsend.png'
import receiveImg from '../../../assets/images/receive.png'
import damageImg from '../../../assets/images/DamageCheck.png'
import scrapImg from '../../../assets/images/Reuse.png'
import realtimeImg from '../../../assets/images/RealTIME.png'
import fscanImg from '../../../assets/images/QR.png'
import freceiveImg from '../../../assets/images/Bin.png'
import SecureImg from '../../../assets/images/Secre.png'
import API from '../../../api.js'

const Login = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    password: '',
    mobilityWithoutCheck: false
  })
  const [bincount, setbincount] = useState({});


  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 5000); 

    return () => clearInterval(interval);
  }, []);

 const loadData = async () => {

  try {

    const res = await API.get("/Auth/bin-count");

    setbincount({
      total: res.data.total || 0,
      available: res.data.available || 0,
      damaged: res.data.damaged || 0,
      inTransit: res.data.inTransit || 0,
      send: res.data.send || 0,
      receive: res.data.receive || 0,
      damageCheck: res.data.damageCheck || 0,
      reuse: res.data.reuse || 0,
      scrap: res.data.scrap || 0
    });

  } catch (err) {

    console.log("Dashboard Count Error", err);
  }
};

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!form.username || !form.password) {
      toast.error('Please enter username & password')
      return
    }

    try {
      const res = await API.post('/Auth/login', form)
      const userData = {
        id: res.data.user.id,
        username: res.data.user.userName,
        email: res.data.user.email,
        usertype: res.data.user.userType,
        mobilityWithoutCheck: form.mobilityWithoutCheck   
      }

      sessionStorage.setItem('user', JSON.stringify(userData))
      window.dispatchEvent(new Event('storage'))
      const isMobile = !form.mobilityWithoutCheck;

      toast.success('Login Successful')

      // Storage info (optional) - runs in background, never blocks login/redirect
      API.get('/Auth/storage')
        .then((storageRes) => {
          const data = storageRes.data

          toast.info(
            <div>
              <div><strong>Database:</strong> {data.databaseName}</div>
              <div><strong>Size:</strong> {data.databaseSizeMB} MB</div>
              <div><strong>Free:</strong> {data.databaseFreeMB} MB</div>

              {(data.drives || []).map((d, index) => (
                <div key={index}>
                  <strong>{d.drive}:</strong> {d.freeSpaceGB} GB Free / {d.totalSpaceGB} GB
                </div>
              ))}
            </div>,
            { autoClose: 5000 },
          )
        })
        .catch((storageErr) => {
          console.log('Storage info error', storageErr)
        })

      if (isMobile) {
        navigate('/m/send');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      toast.error(err.response?.data?.message || 'Login Failed')
    }
  }
  return (
    <div className="login-container">
      <CContainer fluid>
        <CRow className="min-vh-100">

          {/* LEFT SIDE */}
          <CCol lg={8} className="left-panel d-none d-lg-flex flex-column justify-content-center">
            <div className="header-box">
              <img src={logo} alt="Delfingen" className="company-logo" />
              <div className="divider"></div>
              <div>
                <h2 className="mb-1">
                  <span className="bin-text">BIN</span> Management System
                </h2>
                <p className="mb-0">
                  Manage Bin Movement & Logistics Operations Efficiently
                </p>
              </div>

            </div>

            <div className="steps-container">

              <div className="step-card">
                <span className="step-badge">{bincount.send || 0}</span>
                <img src={scanImg} alt="Scan" />
                <h6>Scan & Send</h6>
                <p>Scan bin and dispatch to customer</p>
              </div>

              <div className="step-card">
                <span className="step-badge blue">{bincount.receive || 0}</span>
                <img src={receiveImg} alt="Receive" />
                <h6>Receive</h6>
                <p>Confirm bin received at customer</p>
              </div>

              <div className="step-card">
                <span className="step-badge green">{bincount.damageCheck || 0}</span>
                <img src={damageImg} alt="Damage" />
                <h6>Damage Check</h6>
                <p>Inspection to check for bin condition</p>
              </div>

              <div className="step-card">
                <span className="step-badge orange">{(bincount.scrap || 0) + (bincount.reuse || 0)}</span>
                <img src={scrapImg} alt="Scrap" />
                <h6>Scrap / Reuse</h6>
                <p>Decide reuse or scrap damaged bins</p>
              </div>

            </div>

            <div className="features">

              <div className="feature-item">
                <img src={realtimeImg} alt="Real Time" />
                <span>Real Time</span>
              </div>

              <div className="feature-item">
                <img src={fscanImg} alt="QR" />
                <span>QR Scanning</span>
              </div>

              <div className="feature-item">
                <img src={freceiveImg} alt="Inventory" />
                <span>Bin Inventory</span>
              </div>

              <div className="feature-item">
                <img src={SecureImg} alt="Secure" />
                <span>Secure System</span>
              </div>

            </div>

          </CCol>

          {/* RIGHT SIDE */}
          <CCol xs={12} lg={4} className="right-panel d-flex align-items-center justify-content-center">
            <div className="login-box text-center">

              <div className="avatar-circle">
                <CIcon icon={cilUser} size="xxl" />
              </div>

              <CForm onSubmit={handleLogin}>
                <div className="mb-3 text-start">
                  <label>Username</label>
                  <CFormInput
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Enter Username"
                  />
                </div>

                <div className="mb-3 text-start">
                  <label>Password</label>
                  <CFormInput
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter Password"
                  />
                </div>

                <div className="mb-3 text-start">
                  <label className="d-flex align-items-center gap-2">
                    <input
                      type="checkbox"
                      name="mobilityWithoutCheck"
                      checked={form.mobilityWithoutCheck}
                      onChange={handleChange}
                    />
                    For Mobility Without Check
                  </label>
                </div>

                <CButton type="submit" className="login-btn w-100">
                  Login
                </CButton>

                <div className="footer-text">
                  <span>Build Date : 04-01-2026</span>
                  <span>Version : 1.0</span>
                </div>
              </CForm>
            </div>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
