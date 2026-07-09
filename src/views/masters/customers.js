import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  CButton, CFormInput, CRow, CCol, CCard, CCardBody, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CTooltip
} from '@coreui/react';
import { FaEdit, FaTrash, FaUserPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../../api.js';
import '../../assets/CSS/user.css';
import usePrivilege from '../hooks/usePrivilege.js';
import customerIcon from '../../assets/images/Customerlogo.png'

const CustomerMaster = () => {
  const initialForm = {
    customerId: '',
    customerName: '',
    customerAddress: '',
    gstNo: '',
    state: '',
    email: ''
  };
  const [data, setData] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [form, setForm] = useState(initialForm);
  const customerRef = useRef();
  const [editId, setEditId] = useState(null);
  const { privileges } = usePrivilege();
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const partPrivilege = privileges.find(p => p.menuName === 'Customer') || {}

  const customStyles = {
    rows: {
      style: {
        minHeight: '38px',   // ✅ reduce height
      },
    },
    headCells: {
      style: {
        justifyContent: 'center',
        fontSize: '16px',
        paddingTop: '6px',
        paddingBottom: '6px',
      },
    },
    cells: {
      style: {
        justifyContent: 'center',
        fontSize: '16px',
        paddingTop: '4px',   // ✅ reduce space
        paddingBottom: '4px',
      },
    },
  }

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const res = await API.get('/customers')
    setData(res.data)
  }

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        customerRef.current?.focus()
      }, 100)
    }
  }, [showForm])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'email') {
      setForm({ ...form, [name]: value.toLowerCase() })
    }
    else if (name === 'gstNo') {
      setForm({ ...form, [name]: value.toUpperCase() })
    }
    else {
      setForm({ ...form, [name]: value })
    }
  }

  const validate = () => {
    if (!form.customerId) {
      toast.error('Customer ID required')
      return false
    }

    if (!form.customerName) {
      toast.error('Customer Name required')
      return false
    }

    if (!form.state) {
      toast.error('State required')
      return false
    }

    const emailRegex =
      /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

    // ✅ Validate only if email entered
    if (form.email?.trim()) {

      if (!emailRegex.test(form.email.toLowerCase())) {

        toast.error('Enter valid email')

        return false
      }
    }

    // ✅ GST validation (15 characters - Indian format)
    if (form.gstNo) {
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

      if (!gstRegex.test(form.gstNo.toUpperCase())) {
        toast.error('Invalid GST Number')
        return false
      }
    }

    return true
  }
  const filteredData = data.filter(d =>
    d.customerId.toLowerCase().includes(search.toLowerCase()) ||
    d.customerName.toLowerCase().includes(search.toLowerCase()) ||
    d.state.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      if (editId) {
        await API.put(`/customers/${editId}`, form)
        toast.success('Customer Updated Successfully')
      } else {
        await API.post('/customers', form)
        toast.success('Customer Saved Successfully')
      }

      setForm(initialForm)
      setEditId(null)
      // setShowForm(false)
      loadData()

    } catch (err) {
      toast.error(err.response?.data || 'Something went wrong')
    }
  }
  const handleEdit = (row) => {
    setForm({
      customerId: row.customerId || '',
      customerName: row.customerName || '',
      customerAddress: row.customerAddress || '',
      gstNo: row.gstNo || '',
      state: row.state || '',
      email: row.email || ''
    })
    setEditId(row.id)
    setShowForm(true)
  }

  const confirmDelete = async () => {
    try {
      await API.delete(`/customers/${deleteId}`)
      toast.success('Customer Deleted Successfully')

      // ✅ FIX: clear form if deleted record is currently editing
      if (editId === deleteId) {
        setForm(initialForm)
        setEditId(null)
        setShowForm(false)   // optional (close form)
      }

      loadData()

    } catch {
      toast.error('Delete Failed')
    } finally {
      setShowDeleteModal(false)
      setDeleteId(null)
    }
  }
  const columns = [
    {
      name: 'S.No',
      selector: (row, index) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      center: true,
      width: '80px'
    },
    { name: 'Customer ID', selector: row => row.customerId, center: true },
    {
      name: 'Customer Name',
      center: true,
      cell: row => (
        <CTooltip
          content={row.customerName}
          placement="top"
        >
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '180px',
              cursor: 'pointer'
            }}
          >
            {row.customerName}
          </div>
        </CTooltip>
      )
    },
    {
      name: 'Customer Address',
      center: true,
      cell: row => (
        <CTooltip
          content={row.customerAddress}
          placement="top"
        >
          <div
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '220px',
              cursor: 'pointer'
            }}
          >
            {row.customerAddress}
          </div>
        </CTooltip>
      )
    },
    { name: 'GST No', selector: row => row.gstNo, center: true },
    { name: 'State', selector: row => row.state, center: true },
    { name: 'Email ID', selector: row => row.email, center: true },
    {
      name: 'Action',
      center: true,
      cell: row => (
        <>
          {partPrivilege.canEdit && (

            <FaEdit title="Edit" className="action-icon edit-icon" onClick={() => handleEdit(row)} />)}
          {partPrivilege.canDelete && (

            <FaTrash title="Delete" className="action-icon delete-icon" onClick={() => {
              setDeleteId(row.id)
              setShowDeleteModal(true)
            }} />)}
        </>
      )
    }
  ]

  return (
    <div className="p-3">

      {/* FORM */}
      {showForm && (
        <CCard className="mb-3">
          <CCardBody>

            <div className="d-flex justify-content-between mb-3">
              <h5>{editId ? 'Update Customer' : 'Add Customer'}</h5>
              <CButton
                color="light"
                onClick={() => {
                  setShowForm(false)
                  setForm(initialForm)
                  setEditId(null)
                }}
              >
                ← Back
              </CButton>
            </div>

            <CRow className="g-3">
              <CCol xs={12} md={6} lg={3}>
                <label>Customer ID <span style={{ color: 'red' }}>*</span></label>
                <CFormInput
                  ref={customerRef}
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Customer Name <span style={{ color: 'red' }}>*</span></label>
                  <CFormInput
  name="customerName"
  value={form.customerName}
  onChange={(e) => {
    const validText = e.target.value.replace(/[^a-zA-Z._ ]/g, '')
    setForm({ ...form, customerName: validText })
  }}
  onKeyDown={(e) => {
    if (
      !/[a-zA-Z._ ]/.test(e.key) &&
      e.key !== 'Backspace' &&
      e.key !== 'Tab' &&
      e.key !== 'ArrowLeft' &&
      e.key !== 'ArrowRight' &&
      e.key !== 'Delete'
    ) {
      e.preventDefault()
    }
  }}
/>
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Customer Address <span style={{ color: 'red' }}>*</span></label>
                <CFormInput name="customerAddress" value={form.customerAddress} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>GST No</label>
                <CFormInput name="gstNo" value={form.gstNo} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>State <span style={{ color: 'red' }}>*</span></label>
                <CFormInput name="state" value={form.state} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Email</label>
                <CFormInput name="email" value={form.email} onChange={handleChange} />
              </CCol>
            </CRow>

            <div className="mt-4 text-center">
              <CButton color="success" onClick={handleSubmit}>
                {editId ? 'Update' : 'Save'}
              </CButton>
              <CButton
                color="secondary"
                className="ms-2"
                onClick={() => {
                  setForm(initialForm)
                  setEditId(null)
                }}
              >
                Clear
              </CButton>
            </div>

          </CCardBody>
        </CCard>
      )}

      {/* SUMMARY */}
      <CCard className="mb-3">
        <CCardBody
          style={{
            background: '#4f7c86',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px 20px'
          }}
        >

          {/* LEFT SIDE (EMPTY OR ICON) */}
          <div style={{ width: '50px' }}></div>

          {/* CENTER TEXT */}
          <div className="text-center">
            <h6 style={{ fontSize: '22px', fontWeight: '600', margin: 0 }}>
              Total Customer
            </h6>
            <h3 style={{ margin: 0 }}>{data.length}</h3>
          </div>


          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>

            {/* IMAGE */}
            <img
              src={customerIcon}
              alt="customer"
              style={{ width: '40px', height: '40px' }}
            />

            {/* ADD BUTTON */}
            {!showForm && (
              <div className="text-center">
                <CButton
                  color="dark"
                  shape="rounded-circle"
                  size="sm"
                  onClick={() => {
                    setForm(initialForm)
                    setEditId(null)
                    setShowForm(true)
                  }}
                >
                  <FaUserPlus />
                </CButton>
                <div style={{ fontSize: '18px' }}>Add</div>
              </div>
            )}

          </div>

        </CCardBody>
      </CCard>

      {/* TABLE */}
      <CCard>
        <CCardBody>

          <h6 className="text-center mb-3" style={{ fontSize: '18px', fontWeight: '600' }}>Customer Details</h6>
          <div className="d-flex justify-content-end mb-2">
            <CFormInput
              placeholder="Search..."
              style={{ width: '200px' }}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredData}
            pagination
            highlightOnHover
            striped
            responsive
            customStyles={customStyles}
            persistTableHead
            onChangePage={(page) => setCurrentPage(page)}
            onChangeRowsPerPage={(newPerPage, page) => {
              setRowsPerPage(newPerPage)
              setCurrentPage(page)
            }}
          />
        </CCardBody>
      </CCard>

      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        alignment="center"
        backdrop="static"
      >
        <CModalHeader className="border-0 text-center">
          <CModalTitle className="w-100 text-danger fw-bold">
            ⚠ Confirm Delete
          </CModalTitle>
        </CModalHeader>

        <CModalBody className="text-center">
          <p>
            Are you sure to delete <b>{data.find(d => d.id === deleteId)?.customerName}</b>?
          </p>
        </CModalBody>

        <CModalFooter className="border-0 d-flex justify-content-center gap-2">
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </CButton>

          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

    </div>
  )
}

export default CustomerMaster