import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  CButton, CFormInput, CRow, CCol, CCard, CCardBody, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormSelect
} from '@coreui/react';
import { FaEdit, FaTrash, FaUserPlus, FaUsers } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../../api.js';
import '../../assets/CSS/user.css';
import { MENU_CONFIG } from '../menuConfig.js';
import CIcon from '@coreui/icons-react';
import usePrivilege from '../hooks/usePrivilege.js';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';


const UserMaster = () => {
  const [users, setUsers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    userName: '',
    password: '',
    userType: '',
    email: '',
  })
  const [editId, setEditId] = useState(null);
  const [userTypes, setUserTypes] = useState([]);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const userRef = useRef();
  const [showPrivilegeModal, setShowPrivilegeModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privileges, setPrivileges] = useState([]);
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const sessionUser = JSON.parse(sessionStorage.getItem('user') || 'null');
  const loggedUserType = sessionUser?.usertype;

  const { privileges: userPrivileges = [] } = usePrivilege()
  const uPrivilege =
    userPrivileges.find(p => p.menuName === 'User') || {}
  useEffect(() => { loadUsers() }, [])

  const loadUsers = async () => {
    const res = await API.get('/users')
    setUsers(res.data)
  }

  useEffect(() => {
    loadUsers()
    loadUserTypes()
  }, [])

  const loadUserTypes = async () => {
    const res = await API.get('/users/types')
    setUserTypes(res.data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target

    // ✅ USERNAME → allow only letters & space
    if (name === 'userName') {
      const onlyLetters = value.replace(/[^a-zA-Z ]/g, '')
      setForm({ ...form, userName: onlyLetters })
    }

    // ✅ EMAIL → lowercase
    else if (name === 'email') {
      setForm({ ...form, [name]: value.toLowerCase() })
    }

    else {
      setForm({ ...form, [name]: value })
    }
  }

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        userRef.current?.focus()
      }, 100)
    }
  }, [showForm])
  const filteredUsers = users.filter(u =>
    u.userName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.userType.toLowerCase().includes(search.toLowerCase())
  )

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

  const validate = () => {

    if (!/^[A-Za-z ]+$/.test(form.userName)) {
      toast.error('Username only allows letters')
      return false
    }
    if (!form.userName) {
      toast.error('Username required')
      return false
    }

    if (!form.password && !editId) {
      toast.error('Password required')
      return false
    }

    if (!form.userType) {
      toast.error('User type required')
      return false
    }

    if (!form.email) {
      toast.error('Email required')
      return false
    }

    const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/

    if (!emailRegex.test(form.email.toLowerCase())) {
      toast.error('Enter valid email')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    try {
      if (editId) {

        await API.put(`/users/${editId}`, form)
        toast.success('User Updated Successfully')
        setForm({
          userName: '',
          password: '',
          userType: '',
          email: ''
        })

        setEditId(null)
        // setShowForm(false)
        loadUsers()
      }

      // ================= ADD =================
      else {
        const res = await API.post('/users', form)
        toast.success('User Added Successfully')
        await loadUsers()

        // setShowForm(false)
        setForm({
          userName: '',
          password: '',
          userType: '',
          email: ''
        })
        openPrivilege(res.data)
      }
    }
    catch (err) {
      toast.error(
        err.response?.data || 'Something went wrong'
      )
    }
  }

  const openPrivilege = async (user) => {
    setSelectedUser(user)

    const res = await API.get(`/users/privileges/${user.id}`)

    const mapped = MENU_CONFIG.flatMap(group =>
      group.items.map(menu => {
        const existing = res.data.find(x => x.menuName === menu.name)

        return {
          menuName: menu.name,   // ✅ FIX HERE
          canView: existing?.canView || false,
          canEdit: existing?.canEdit || false,
          canDelete: existing?.canDelete || false
        }
      })
    )
    setPrivileges(mapped)
    setShowPrivilegeModal(true)
  }

  useEffect(() => {
    if (showForm && !editId) {
      setForm({
        userName: '',
        password: '',
        userType: '',
        email: ''
      })
    }
  }, [showForm, editId])

  const handleEdit = (row) => {
    setForm(row)
    setEditId(row.id)
    setShowForm(true)
  }

  const handlePrivilegeChange = (index, field) => {
    if (index === -1) return

    const updated = [...privileges]

    if (field === 'all') {
      const val = !(updated[index].canView && updated[index].canEdit && updated[index].canDelete)

      updated[index] = {
        ...updated[index],
        canView: val,
        canEdit: val,
        canDelete: val
      }
    }

    else if (field === 'canView') {
      updated[index].canView = !updated[index].canView
    }

    else if (field === 'canEdit') {
      updated[index].canEdit = !updated[index].canEdit
      // ❌ REMOVE THIS:
      // if (val) updated[index].canView = true
    }

    else if (field === 'canDelete') {
      updated[index].canDelete = !updated[index].canDelete
    }

    setPrivileges(updated)
  }

  const handleHeaderChange = (field, value) => {
    const updated = privileges.map(p => {

      if (field === 'all') {
        return {
          ...p,
          canView: value,
          canEdit: value,
          canDelete: value
        }
      }

      if (field === 'canView') {
        return {
          ...p,
          canView: value
        }
      }

      if (field === 'canEdit') {
        return {
          ...p,
          canEdit: value   // ✅ NO dependency
        }
      }

      if (field === 'canDelete') {
        return {
          ...p,
          canDelete: value   // ✅ NO dependency
        }
      }

      return p
    })

    setPrivileges(updated)
  }
  const savePrivileges = async () => {

    const payload = privileges
      .filter(p =>
        p.canView ||
        p.canEdit ||
        p.canDelete
      )
      .map(p => ({
        userId: selectedUser.id,
        menuName: p.menuName,
        canView: p.canView,
        canEdit: p.canEdit,
        canDelete: p.canDelete
      }))

    // ✅ PREVENT EMPTY API CALL
    if (payload.length === 0) {

      toast.error('Select at least one privilege')

      return
    }

    try {

      await API.post(
        '/users/privileges',
        payload
      )

      toast.success('Privileges Saved')

      setShowPrivilegeModal(false)

    } catch (err) {

      toast.error(
        err?.response?.data ||
        'Failed to save privileges'
      )
    }
  }

  const confirmDelete = async () => {
    try {
      await API.delete(`/users/${deleteId}`)
      toast.success('Deleted Successfully')

      // ✅ FIX: clear form if deleted user is currently editing
      if (editId === deleteId) {
        setForm({
          userName: '',
          password: '',
          userType: '',
          email: ''
        })
        setEditId(null)
        setShowForm(false)   // optional (close form)
      }

      loadUsers()

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
    { name: 'User Name', selector: row => row.userName, center: true },
    { name: 'User Type', selector: row => row.userType, center: true },
    { name: 'Email ID', selector: row => row.email, center: true },

    {
      name: 'Action',
      center: true,
      cell: row => (
        <>
          {uPrivilege?.canEdit && (
            <FaEdit
              title="Edit"
              className="action-icon edit-icon"
              onClick={() => handleEdit(row)}
            />
          )}
          {uPrivilege?.canDelete && (

            <FaTrash
              title="Delete"
              className="action-icon delete-icon"
              onClick={() => {
                setDeleteId(row.id)
                setShowDeleteModal(true)
              }}
            />
          )}
          {(loggedUserType === 'Admin' || loggedUserType === 'Super Admin') && (
            <FaUsers
              title="Privileges"
              className="action-icon user-icon"
              onClick={() => openPrivilege(row)}
            />
          )}
        </>
      )
    }
  ]

  return (
    <div className="p-3">

      {/* ================= FORM ================= */}
      {showForm && (
        <CCard className="mb-3 shadow-sm">
          <CCardBody>

            {/* HEADER WITH BACK BUTTON */}
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5>{editId ? 'Update User' : 'Add User'}</h5>

              <CButton
                color="light"
                onClick={() => {
                  setShowForm(false)
                  setEditId(null)
                  setForm({ userName: '', password: '', userType: '', email: '' }) // 🔥 ADD THIS
                }}
              >
                ← Back
              </CButton>
            </div>

            <CRow className="g-3">
              <CCol xs={12} md={6} lg={3}>
                <label>User Name <span style={{ color: 'red' }}>*</span></label>
                <CFormInput
                  ref={userRef}
                  name="userName"
                  value={form.userName}
                  onChange={handleChange}
                  onKeyPress={(e) => {
                    if (!/[a-zA-Z ]/.test(e.key)) {
                      e.preventDefault()
                    }
                  }}
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Password <span style={{ color: 'red' }}>*</span></label>
                <CFormInput type="password" name="password" value={form.password} onChange={handleChange} />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>User Type <span style={{ color: 'red' }}>*</span></label>
                <CreatableSelect
                  options={userTypes.map(t => ({
                    value: t.value,
                    label: t.label
                  }))}

                  value={
                    form.userType
                      ? {
                        value: form.userType,
                        label: form.userType
                      }
                      : null
                  }

                  onChange={(selected) =>
                    setForm({
                      ...form,
                      userType: selected ? selected.value : ''
                    })
                  }

                  // ✅ CREATE NEW USER TYPE
                  onCreateOption={(inputValue) => {
                    const upperValue = inputValue.toUpperCase()

                    const newOption = {
                      value: upperValue,
                      label: upperValue,
                    }

                    setUserTypes([...userTypes, newOption])

                    setForm({
                      ...form,
                      userType: upperValue,
                    })
                  }}

                  placeholder="Select or Type User Type"
                  isSearchable
                  isClearable
                  formatCreateLabel={(inputValue) =>
                    `Add "${inputValue}"`
                  }
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>Email <span style={{ color: 'red' }}>*</span></label>
                <CFormInput name="email" value={form.email} onChange={handleChange} />
              </CCol>
            </CRow>

            {/* CENTER BUTTONS */}
            <div className="mt-4 text-center">
              <CButton color="success" onClick={handleSubmit}>
                {editId ? 'Update' : 'Save'}
              </CButton>

              <CButton
                color="secondary"
                className="ms-2"
                onClick={() => {
                  setForm({
                    userName: '',
                    password: '',
                    userType: '',
                    email: ''
                  });
                  setEditId(null);   // ✅ ADD THIS LINE
                }}
              >
                Clear
              </CButton>
            </div>

          </CCardBody>
        </CCard>
      )}

      {/* ================= SUMMARY CARD ================= */}
      <CCard className="mb-3 shadow-sm">
        <CCardBody
          className="d-flex justify-content-between align-items-center rounded px-4"
          style={{ background: '#6fb7c1', color: '#fff' }}
        >

          {/* LEFT SIDE */}
          <div className="text-center w-100">
            <h6 className="mb-1" style={{ fontSize: '22px', fontWeight: '600' }}>Total Users</h6>
            <h3 className="mb-0">{users.length}</h3>
          </div>

          {/* RIGHT SIDE ICON */}
          <div className="d-flex align-items-center gap-3">

            <FaUsers size={28} />

            {!showForm && (
              <div className="text-center">
                <CButton
                  color="dark"
                  shape="rounded-circle"
                  onClick={() => {
                    setForm({ userName: '', password: '', userType: '', email: '' })
                    setEditId(null)
                    setShowForm(true)
                  }}
                >
                  <FaUserPlus />
                </CButton>
                <div style={{ fontSize: '11px' }}>Add</div>
              </div>
            )}

          </div>

        </CCardBody>
      </CCard>

      {/* ================= TABLE ================= */}
      <CCard>
        <CCardBody>

          <h6 className="mb-3 text-center" style={{ fontSize: '18px', fontWeight: '600' }}>User Details</h6>

          <div className="d-flex justify-content-end mb-2">
            <CFormInput
              placeholder="Search..."
              style={{ width: '200px' }}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredUsers}
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
            Are you sure to delete <b>{users.find(d => d.id === deleteId)?.userName}</b>?
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

      <CModal
        visible={showPrivilegeModal}
        onClose={() => setShowPrivilegeModal(false)}
        size="lg"
      >
        <CModalHeader className="d-flex justify-content-between align-items-center">

          <div className="d-flex align-items-center gap-2">
            <FaUsers style={{ color: '#4a90e2' }} />

            <span style={{ color: '#4a90e2', fontWeight: '600' }}>
              User Privilege
            </span>

            <span style={{ color: '#555' }}>
              - {selectedUser?.userName}
            </span>
          </div>

        </CModalHeader>

        <CModalBody>

          <table className="table table-bordered text-center privilege-table">
            <thead>
              <tr>
                <th>Menus</th>
                <th>
                  All <br />
                  <input
                    type="checkbox"
                    checked={privileges.every(x =>
                      x.canView && x.canEdit && x.canDelete
                    )}
                    onChange={(e) =>
                      handleHeaderChange('all', e.target.checked)
                    }
                  />
                </th>

                <th>
                  View <br />
                  <input
                    type="checkbox"
                    checked={privileges.every(x => x.canView)}
                    onChange={(e) =>
                      handleHeaderChange('canView', e.target.checked)
                    }
                  />
                </th>

                <th>
                  Edit <br />
                  <input
                    type="checkbox"
                    checked={privileges.every(x => x.canEdit)}
                    onChange={(e) =>
                      handleHeaderChange('canEdit', e.target.checked)
                    }
                  />
                </th>

                <th>
                  Delete <br />
                  <input
                    type="checkbox"
                    checked={privileges.every(x => x.canDelete)}
                    onChange={(e) =>
                      handleHeaderChange('canDelete', e.target.checked)
                    }
                  />
                </th>
              </tr>
            </thead>

            <tbody>
              {MENU_CONFIG.map((group, gIndex) => (
                <React.Fragment key={gIndex}>

                  {/* GROUP HEADER */}
                  <tr className="group-row">
                    <td colSpan="5">{group.group}</td>
                  </tr>

                  {/* ITEMS */}
                  {group.items.map((menu) => {
                    const index = privileges.findIndex(x => x.menuName === menu.name)
                    const p = privileges[index] || {}

                    return (
                      <tr key={menu.name}>
                        <td className="menu-cell">
                          <div className="d-flex align-items-center gap-2">
                            <CIcon icon={menu.icon} size="sm" />
                            {menu.name}
                          </div>
                        </td>

                        {/* ALL */}
                        {/* ALL */}
                        <td>
                          <input
                            type="checkbox"
                            checked={p.canView && p.canEdit && p.canDelete}
                            onChange={() =>
                              handlePrivilegeChange(index, 'all')
                            }
                          />
                        </td>

                        {/* VIEW */}
                        <td>
                          <input
                            type="checkbox"
                            checked={p.canView || false}
                            onChange={() =>
                              handlePrivilegeChange(index, 'canView')
                            }
                          />
                        </td>

                        {/* EDIT */}
                        <td>
                          <input
                            type="checkbox"
                            checked={p.canEdit || false}
                            onChange={() =>
                              handlePrivilegeChange(index, 'canEdit')
                            }
                          />
                        </td>

                        {/* DELETE */}
                        <td>
                          <input
                            type="checkbox"
                            checked={p.canDelete || false}
                            onChange={() =>
                              handlePrivilegeChange(index, 'canDelete')
                            }
                          />
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>

        </CModalBody>
        <CModalFooter className="justify-content-center">
          <CButton color="success" onClick={savePrivileges}>Save</CButton>
          <CButton color="secondary" onClick={() => setShowPrivilegeModal(false)}>Clear</CButton>
        </CModalFooter>
      </CModal>

    </div>
  )
}

export default UserMaster