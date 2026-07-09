import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  CButton, CFormInput, CRow, CCol, CCard, CFormSelect, CCardBody, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter
} from '@coreui/react'
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../../api.js';
import '../../assets/CSS/user.css';
import usePrivilege from '../hooks/usePrivilege.js';
import partIcon from '../../assets/images/Partlogo.png';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const PartMaster = () => {

  const initialForm = {
    partNo: '',
    binMaterialType: '',
    binColor: '',
    length: '',
    width: '',
    height: '',
    binOwner: ''
  }

  const [data, setData] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materials, setMaterials] = useState([]);
  const partNoRef = useRef();
  const { privileges } = usePrivilege()
  const partPrivilege = privileges.find(p => p.menuName === 'Part') || {}

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
        paddingTop: '4px',
        paddingBottom: '4px',
      },
    },
  }


  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const res = await API.get('/parts')
    setData(res.data)
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    loadData()
    loadMaterials()
  }, [])

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        partNoRef.current?.focus()
      }, 100)
    }
  }, [showForm])

  const loadMaterials = async () => {
    const res = await API.get('/materials')
    setMaterials(res.data)
  }

  const validate = () => {
    if (!form.partNo) {
      toast.error('Part No required')
      return false
    }

    if (!form.binMaterialType) {
      toast.error('Material Type required')
      return false
    }

    if (!form.length || !form.width || !form.height) {
      toast.error('Size is required')
      return false
    }

    return true
  }

  const handleSubmit = async () => {
    const isValid = validate()

    if (!isValid) return   // ✅ now works correctly

    try {
      if (editId) {
        await API.put(`/parts/${editId}`, form)
        toast.success('Updated Successfully')
      } else {
        await API.post('/parts', form)
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

  const filteredData = data.filter(d =>
    d.partNo.toLowerCase().includes(search.toLowerCase()) ||
    d.binMaterialType.toLowerCase().includes(search.toLowerCase()) ||
    d.binColor?.toLowerCase().includes(search.toLowerCase()) ||
    d.binOwner?.toLowerCase().includes(search.toLowerCase())
  )

  const handleEdit = (row) => {
    setForm(row)
    setEditId(row.id)
    setShowForm(true)
  }

  const confirmDelete = async () => {
    try {
      await API.delete(`/parts/${deleteId}`)
      toast.success('Deleted Successfully')


      if (editId === deleteId) {
        setForm(initialForm)
        setEditId(null)
        setShowForm(false)
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
      width: '90px'
    },
    { name: 'Part No', selector: row => row.partNo, center: true },
    { name: 'Packages Material Type', selector: row => row.binMaterialType,   width: '220px' , center: true },
    { name: 'Packages Color', selector: row => row.binColor, center: true },
    { name: 'Size', selector: row => `${row.length}*${row.width}*${row.height}`, center: true },
    { name: 'Packages Owner', selector: row => row.binOwner, center: true },
    {
      name: 'Action', center: true,
      cell: row => (
        <>
          {/* ✅ EDIT */}
          {partPrivilege.canEdit && (
            <FaEdit
              title="Edit"
              className="action-icon edit-icon"
              onClick={() => handleEdit(row)}
            />
          )}

          {/* ✅ DELETE */}
          {partPrivilege.canDelete && (
            <FaTrash
              title="Delete"
              className="action-icon delete-icon"
              onClick={() => {
                setDeleteId(row.id)
                setShowDeleteModal(true)
              }}
            />
          )}
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
              <h5>{editId ? 'Update Part' : 'Add Part'}</h5>
              <CButton
                color="light"
                onClick={() => {
                  setShowForm(false)
                  setForm(initialForm)   // ✅ clear form
                  setEditId(null)        // ✅ reset edit mode
                }}
              >
                ← Back
              </CButton>
            </div>

            <CRow className="g-3">
              <CCol xs={12} md={6} lg={3}>
                <label>Part No <span style={{ color: 'red' }}>*</span></label>
                <CFormInput
                  ref={partNoRef}
                  name="partNo"
                  value={form.partNo}
                  onChange={(e) => {

                    const value = e.target.value.toUpperCase()

                    // ❌ Invalid special character check
                    if (/[^A-Z0-9_-]/.test(value)) {

                      toast.dismiss()

                      toast.error(
                        'Only letters, numbers, _ and - are allowed'
                      )

                      return
                    }

                    setForm({
                      ...form,
                      partNo: value
                    })
                  }}
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Packages Material Type <span style={{ color: 'red' }}>*</span></label>
                <CreatableSelect
                  options={materials.map(m => ({
                    value: m.materialName,
                    label: m.materialName
                  }))}

                  value={
                    form.binMaterialType
                      ? {
                        value: form.binMaterialType,
                        label: form.binMaterialType
                      }
                      : null
                  }

                  onChange={(selected) => {
                    setForm({
                      ...form,
                      binMaterialType: selected ? selected.value : ''
                    })
                  }}

                  // ✅ CREATE NEW OPTION
                  onCreateOption={(inputValue) => {

                    const newOption = {
                      value: inputValue,
                      label: inputValue
                    }

                    // add immediately in dropdown UI
                    setMaterials([
                      ...materials,
                      { materialName: inputValue }
                    ])

                    // set selected value
                    setForm({
                      ...form,
                      binMaterialType: inputValue
                    })
                  }}

                  placeholder="Select or Type Material Type"
                  isSearchable
                  isClearable
                  formatCreateLabel={(inputValue) =>
                    `Add "${inputValue}"`
                  }
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Packages Color</label>
                <CFormInput name="binColor" value={form.binColor} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Packages Owner</label>
                <CFormInput
                  name="binOwner"
                  value={form.binOwner}
                  onChange={(e) => {
                    const onlyLetters = e.target.value.replace(/[^a-zA-Z ]/g, '');
                    setForm({ ...form, binOwner: onlyLetters });
                  }}
                  onKeyPress={(e) => {
                    if (!/[a-zA-Z ]/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>
                  Size (L*W*H in mm) <span style={{ color: 'red' }}>*</span>
                </label>

                <div className="d-flex gap-2">

                  <CFormInput
                    name="length"
                    placeholder="L"
                    value={form.length}

                    onChange={(e) => {

                      const val = e.target.value

                      if (!/^\d*$/.test(val)) {

                        toast.dismiss()

                        toast.error('Only numbers are allowed')

                        return
                      }

                      setForm({
                        ...form,
                        length: val
                      })
                    }}
                  />

                  <CFormInput
                    name="width"
                    placeholder="W"
                    value={form.width}

                    onChange={(e) => {

                      const val = e.target.value

                      if (!/^\d*$/.test(val)) {

                        toast.dismiss()

                        toast.error('Only numbers are allowed')

                        return
                      }

                      setForm({
                        ...form,
                        width: val
                      })
                    }}
                  />

                  <CFormInput
                    name="height"
                    placeholder="H"
                    value={form.height}

                    onChange={(e) => {

                      const val = e.target.value

                      if (!/^\d*$/.test(val)) {

                        toast.dismiss()

                        toast.error('Only numbers are allowed')

                        return
                      }

                      setForm({
                        ...form,
                        height: val
                      })
                    }}
                  />

                </div>
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
                  setForm(initialForm);
                  setEditId(null);   // ✅ IMPORTANT
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
            background: '#7dbcc6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '15px 20px'
          }}
        >

          {/* LEFT SPACE (balance center) */}
          <div style={{ width: '50px' }}></div>

          {/* CENTER TEXT */}
          <div className="text-center">
            <h6 style={{ fontSize: '22px', fontWeight: '600', margin: 0 }}>
              Total Parts
            </h6>
            <h3 style={{ margin: 0 }}>{data.length}</h3>
          </div>

          {/* RIGHT SIDE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>

            {/* ✅ PART IMAGE */}
            <img
              src={partIcon}
              alt="part"
              style={{
                width: '35px',
                height: '35px',
                objectFit: 'contain'
              }}
            />

            {/* ✅ ADD BUTTON */}
            {!showForm && (
              <div className="text-center">
                <CButton
                  color="dark"
                  shape="rounded-circle"
                  size="sm"
                  onClick={() => {
                    setForm(initialForm)   // ✅ clear old data
                    setEditId(null)        // ✅ ensure ADD mode
                    setShowForm(true)
                  }}
                >
                  <FaPlus />
                </CButton>
                <div style={{ fontSize: '11px' }}>Add</div>
              </div>
            )}

          </div>

        </CCardBody>
      </CCard>

      {/* TABLE */}
      <CCard>
        <CCardBody>

          <h6 className="text-center mb-3" style={{ fontSize: '18px', fontWeight: '600' }}>Part Details</h6>

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
            striped
            responsive
            highlightOnHover
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
            Are you sure to delete <b>{data.find(d => d.id === deleteId)?.partNo}</b>?
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

export default PartMaster