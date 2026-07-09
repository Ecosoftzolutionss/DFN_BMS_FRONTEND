import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  CButton, CFormInput, CRow, CCol, CCard, CCardBody, CFormSelect, CModal, CModalHeader, CModalTitle,
  CModalBody, CModalFooter
} from '@coreui/react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../../api';
import '../../assets/CSS/bin.css';
import CreatableSelect from 'react-select/creatable'
import '../../assets/CSS/user.css';
import usePrivilege from '../hooks/usePrivilege.js';
import transitImg from '../../assets/images/In Transit.png';
import Select from 'react-select'

const TransportMaster = () => {

  const initialForm = {
    vehicleNo: '',
    vehicleType: '',
    transportName: '',
    // driverName: '',
    // driverNo: ''
  };

  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const vehicleRef = useRef();
  const { privileges } = usePrivilege();
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const partPrivilege = privileges.find(p => p.menuName === 'Transport') || {};

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
    const res = await API.get('/transports')
    setData(res.data)
  }

  useEffect(() => {
    loadData()
    loadVehicleTypes()
  }, [])

  const loadVehicleTypes = async () => {
    const res = await API.get('/vehicletypes')
    setVehicleTypes(res.data)
  }

  useEffect(() => {
    if (showForm && !editId) {
      setTimeout(() => {
        vehicleRef.current?.focus()
      }, 100)
    }
  }, [showForm, editId])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'vehicleNo') {
      let val = value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

      // ✅ LIMIT FORMAT
      if (val.length > 10) return;

      setForm({
        ...form,
        vehicleNo: val
      });
    } else {
      setForm({ ...form, [name]: value })
    }
  }

  const validate = () => {
    const vehicleRegex =
      /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/i
    // const mobileRegex = /^[0-9]{10}$/

    if (!form.vehicleNo) {
      toast.error('Vehicle No is required')
      return false
    }

    if (!vehicleRegex.test(form.vehicleNo)) {
      toast.error('Invalid Vehicle No format (e.g., TN01AB1234)')
      return false
    }

    if (!form.vehicleType) {
      toast.error('Vehicle Type is required')
      return false
    }

    // if (form.driverNo && !mobileRegex.test(form.driverNo)) {
    //   toast.error('Driver No must be 10 digits')
    //   return false
    // }

    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return

    try {
      if (editId) {
        await API.put(`/transports/${editId}`, form)
        toast.success('Updated Successfully')
      } else {
        await API.post('/transports', form)
        toast.success('Saved Successfully')
      }

      setForm(initialForm)
      setEditId(null)
      //setShowForm(false)
      loadData()

    } catch (err) {
      toast.error(err.response?.data || 'Something went wrong')
    }
  }

  const handleEdit = (row) => {
    setForm(row)
    setEditId(row.id)
    setShowForm(true)
  }

  const confirmDelete = async () => {
    try {
      await API.delete(`/transports/${deleteId}`)
      toast.success('Deleted Successfully')

      // ✅ FIX: clear form if same record
      if (editId === deleteId) {
        setForm(initialForm)
        setEditId(null)
        setShowForm(false) // optional
      }

      loadData()

    } catch {
      toast.error('Delete Failed')
    } finally {
      setShowDeleteModal(false)
      setDeleteId(null)
    }
  }
  const filteredData = data.filter(x =>
    x.vehicleNo.toLowerCase().includes(search.toLowerCase()) ||
    x.transportName.toLowerCase().includes(search.toLowerCase())
  )

  const columns = [
    {
      name: 'S.No',
      selector: (row, index) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      center: true,
      width: '90px'
    },
    { name: 'Vehicle No', selector: row => row.vehicleNo, center: true },
    { name: 'Vehicle Type', selector: row => row.vehicleType, center: true },
    { name: 'Transport Name', selector: row => row.transportName, center: true },
    // { name: 'Driver Name', selector: row => row.driverName, center: true },
    // { name: 'Driver No', selector: row => row.driverNo, center: true },
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
    <div className="binmaster p-3">

      {/* ===== FORM ===== */}
      {showForm && (
        <CCard className="mb-3">
          <CCardBody>

            <div className="d-flex justify-content-between mb-3">
              <h5>{editId ? 'Update Transport' : 'Add Transport'}</h5>
              <CButton color="light" onClick={() => {
                setShowForm(false)
                setForm(initialForm)
                setEditId(null)
              }}>← Back</CButton>
            </div>

            <CRow className="g-3">

              <CCol xs={12} md={6} lg={4}>
                <label>Vehicle No <span style={{ color: 'red' }}>*</span></label>
                <CFormInput ref={vehicleRef} name="vehicleNo" value={form.vehicleNo} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={4}>
                <label>Vehicle Type <span style={{ color: 'red' }}>*</span></label>
                <CreatableSelect
                  options={vehicleTypes.map(v => ({
                    value: v.vehicleType,
                    label: v.vehicleType
                  }))}

                  value={
                    form.vehicleType
                      ? {
                        value: form.vehicleType,
                        label: form.vehicleType
                      }
                      : null
                  }

                  onChange={(selected) => {
                    setForm({
                      ...form,
                      vehicleType: selected ? selected.value : ''
                    })
                  }}

                  // ✅ CREATE NEW VEHICLE TYPE
                  onCreateOption={(inputValue) => {

                    // add immediately in dropdown
                    setVehicleTypes([
                      ...vehicleTypes,
                      {
                        vehicleType: inputValue
                      }
                    ])

                    // select created value
                    setForm({
                      ...form,
                      vehicleType: inputValue
                    })
                  }}

                  placeholder="Select or Type Vehicle Type"
                  isSearchable
                  isClearable
                  formatCreateLabel={(inputValue) =>
                    `Add "${inputValue}"`
                  }
                />
              </CCol>

              <CCol xs={12} md={6} lg={4}>
                <label>Transport Name</label>
                <CFormInput name="transportName" value={form.transportName} onChange={handleChange} />
              </CCol>

              {/* <CCol xs={12} md={6} lg={3}>
                <label>Driver Name</label>
                <CFormInput name="driverName" value={form.driverName} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Driver No</label>
                <CFormInput
                  name="driverNo"
                  value={form.driverNo}
                  maxLength={10}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '') // only numbers
                    setForm({ ...form, driverNo: val })
                  }}
                />
              </CCol> */}

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

      {/* ===== SUMMARY ===== */}
      <CCard className="mb-3">
        <CCardBody className="summary-container">

          <div className="summary-card blue">
            <div className="content">
              <div className="title">Total Transport</div>
              <div className="value">{data.length}</div>
            </div>
            <div className="icon">
              <img src={transitImg} alt="In Transit" />
            </div>
          </div>

          <div className="summary-card blue" style={{ background: '#6c63ff' }}>
            <div className="content">
              <div className="title">Total Vehicles</div>
              <div className="value">{data.length}</div>
            </div>
            <div className="icon">
              <img src={transitImg} alt="In Transit" />
            </div>
          </div>

          {!showForm && (
            <div className="add-btn">
              <CButton
                shape="rounded-circle"
                color="dark"
                onClick={() => {
                  setForm(initialForm)
                  setEditId(null)
                  setShowForm(true)
                }}
              >
                <FaPlus />
              </CButton>
              <div className="add-text">Add</div>
            </div>
          )}

        </CCardBody>
      </CCard>

      {/* ===== TABLE ===== */}
      <CCard>
        <CCardBody>

          <h6 className="text-center mb-3">Transports Details</h6>

          <div className="d-flex justify-content-end mb-2">
            <CFormInput placeholder="Search..." style={{ width: 200 }}
              onChange={(e) => setSearch(e.target.value)} />
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
            Are you sure to delete <b>{data.find(d => d.id === deleteId)?.vehicleNo}</b>?
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

export default TransportMaster