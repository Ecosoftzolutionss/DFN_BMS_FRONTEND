import React, { useEffect, useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CButton, CFormInput, CRow, CCol, CCard, CCardBody, CFormSelect, CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter
} from '@coreui/react';
import DataTable from 'react-data-table-component';
import { FaPlus, FaTrash, FaPrint, FaEdit } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API from '../../api';
import '../../assets/CSS/user.css';
import '../../assets/CSS/bin.css';
import logo from '../../../src/assets/images/Comlogo.png';
import usePrivilege from '../hooks/usePrivilege.js';
import totalBinImg from '../../assets/images/Total Bin.png'
import availableImg from '../../assets/images/Available Bin.png';
import transitImg from '../../assets/images/In Transit.png';
import damaged from '../../assets/images/Damaged.png';
import Select from 'react-select';


const BinMaster = () => {

  const initialForm = {
    partNo: '',
    binMaterialType: '',
    binColor: '',
    length: '',
    width: '',
    height: '',
    binOwner: '',
    manufactureDate: '',
    binCount: '',
    lifecyclecount: '',
    returnduration: ''
  }

  const [form, setForm] = useState(initialForm);
  const [data, setData] = useState([]);
  const [counts, setCounts] = useState({});
  const [editId, setEditId] = useState(null);
  const [parts, setParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [newBins, setNewBins] = useState([]);
  const partRef = useRef();
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const { privileges } = usePrivilege()
  const partPrivilege = privileges.find(p => p.menuName === 'Packages') || {}

  const customStyles = {
    rows: {
      style: {
        minHeight: '38px',
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


  const getSinglePrintStyle = () => `
<style>

@page{
  size:50mm 25mm;
  margin:0;
}

html,body{
  margin:0;
  padding:0;
  width:50mm;
  height:25mm;
  overflow:hidden;
  font-family:Arial,sans-serif;
}

.label{
  width:50mm;
  height:25mm;
  border:1px solid #000;
  box-sizing:border-box;
  display:flex;
  align-items:center;
  padding:1mm;
}

.qr{
  width:20mm;
  height:20mm;
  flex-shrink:0;
}

 .text{
  flex:1;
  margin-left:2mm;
  height:20mm;
  display:flex;
  flex-direction:column;
  justify-content:space-evenly;
  align-items:flex-start;
}

.binno{
  font-size:17px;
  font-weight:900;
  line-height:1;
  margin:0;
}


.partno{
  font-size:11px;
  font-weight:500;
  line-height:1;
  margin:0;
}

.logo{
  width:24mm;
  height:auto;
  display:block;
}

</style>
`;

const getMultiplePrintStyle = () => `
<style>

@page{
  size:50mm 25mm;
  margin:0;
}

html,body{
  margin:0;
  padding:0;
  font-family:Arial,sans-serif;
}

.label{
  width:50mm;
  height:25mm;
  border:1px solid #000;
  box-sizing:border-box;

  display:flex;
  align-items:center;
  padding:1mm;

  page-break-after:always;
}

.qr{
  width:20mm;
  height:20mm;
  flex-shrink:0;
}

.text{
  flex:1;
  margin-left:2mm;

  height:20mm;

  display:flex;
  flex-direction:column;
  justify-content:space-evenly;
  align-items:flex-start;
}

.binno{
  font-size:18px;
  font-weight:900;
  line-height:1;
  margin:0;
}

.partno{
  font-size:12px;
  font-weight:600;
  line-height:1;
  margin:0;
}

.logo{
  width:26mm;
  height:auto;
  display:block;
}

</style>
`;

  useEffect(() => {
    loadData()
    loadParts()
  }, [])



  const loadData = async () => {
    const res = await API.get('/bins')
    setData(res.data.list)
    setCounts(res.data)
  }

  const loadParts = async () => {
    const res = await API.get('/parts')
    setParts(res.data)
  }

  useEffect(() => {
    if (showForm) {
      setTimeout(() => {
        partRef.current?.focus()
      }, 100)
    }
  }, [showForm])

  // ✅ AUTO FILL
  const handlePartChange = (e) => {
    const p = parts.find(x => x.partNo === e.target.value)

    if (!p) return

    setForm({
      ...form,
      partNo: p.partNo,
      binMaterialType: p.binMaterialType,
      binColor: p.binColor,
      length: p.length,
      width: p.width,
      height: p.height,
      binOwner: p.binOwner
    })
  }

  const handleSubmit = async () => {
    try {
      if (!form.partNo)
        return toast.error('Part No is required');

      if (!form.manufactureDate)
        return toast.error('Manufacture Date is required');

      // ✅ NEW CHECKS (NO API CALL IF EMPTY)
      if (!form.binCount)
        return toast.error('Please enter Bin Count');

      if (!form.lifecyclecount)
        return toast.error('Please enter Life Cycle Count');

      if (!form.returnduration)
        return toast.error('Please enter Return Duration');

      if (editId) {
        await API.put(`/bins/${editId}`, form);
        toast.success('Bin Updated Successfully');
      } else {
        const res = await API.post('/bins', form);
        toast.success('Bins Created Successfully');
        setNewBins(res.data);
      }

      loadData();
      setForm(initialForm);
      setEditId(null);
      setShowForm(false);

    } catch (err) {
      toast.error(err.response?.data || 'Error');
    }
  };
  const handleEdit = (row) => {
    setForm({
      partNo: row.partNo,
      binMaterialType: row.binMaterialType,
      binColor: row.binColor,
      length: row.length,
      width: row.width,
      height: row.height,
      binOwner: row.binOwner,
      manufactureDate: row.manufactureDate?.split('T')[0],
      lifecyclecount: row.lifeCycleCount,
      returnduration: row.returnDuration,
      binCount: 1
    });

    setEditId(row.id);
    setShowForm(true);
    setTimeout(() => {

      partRef.current?.focus()

    }, 200)
  };
  const filteredData = data.filter(item => {
    const matchSearch =
      item.binNo.toLowerCase().includes(search.toLowerCase()) ||
      item.partNo.toLowerCase().includes(search.toLowerCase())

    if (selectedFilter === 'available') return matchSearch && item.status === 'Available'
    if (selectedFilter === 'send') return matchSearch && item.status === 'Send'
    if (selectedFilter === 'damaged') return matchSearch && item.status === 'Damaged'

    return matchSearch
  })

  const confirmDelete = async () => {
    setLoading(true)
    try {
      await API.delete(`/bins/${deleteId}`)

      toast.success('Deleted successfully')

      loadData()

      // ✅ 🔥 IMPORTANT FIX
      setForm(initialForm)     // clear form
      setEditId(null)          // exit edit mode
      setShowForm(false)       // hide form

    } catch {
      toast.error('Delete failed')
    } finally {
      setLoading(false)
      setShowDeleteModal(false)
      setDeleteId(null)
    }
  }
  const printSingle = (row) => {
    const qrUrl =
      `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${row.binNo}`;

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Label</title>
       ${getSinglePrintStyle()}
      </head>

      <body>

     <div class="label">
  <img src="${qrUrl}" class="qr" />

  <div class="text">
    <div class="binno">${row.binNo}</div>
    <div class="partno">${row.partNo}</div>
    <img src="${logo}" class="logo" />
  </div>
</div>

        <script>
          window.onload = function () {
            setTimeout(() => {
              window.print();
            }, 500);

            window.onafterprint = function () {
              window.close();
            };
          };
        </script>

      </body>
    </html>
  `);

    printWindow.document.close();
  };

  const printNewBins = () => {

    if (!newBins.length) return;

    const printWindow = window.open('', '_blank');

    const labels = newBins.map((row) => {
      const qrUrl =
        `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${row.binNo}`;

      return `
    <div class="label">
      <img src="${qrUrl}" class="qr"/>

      <div class="text">
        <div class="binno">${row.binNo}</div>
        <div class="partno">${row.partNo}</div>
        <img src="${logo}" class="logo"/>
      </div>
    </div>
  `;
    }).join('');

    printWindow.document.write(`
    <html>
      <head>
        <title>Print Multiple QR Labels</title>
       ${getMultiplePrintStyle()}
      </head>

      <body>
       
          ${labels}
       

        <script>
          window.onload = function () {
            setTimeout(() => {
              window.print();
            }, 500);

            window.onafterprint = function () {
              window.close();
            };
          };
        </script>
      </body>
    </html>
  `);

    printWindow.document.close();
  };
  const columns = [
    {
      name: 'S.No',
      selector: (row, index) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      center: true
    },
    { name: 'Part No', selector: row => row.partNo },
    { name: 'Packages No', selector: row => row.binNo },
    {
      name: 'Packages Material Type',
      selector: row => row.binMaterialType,
      width: '220px'
    },
    { name: 'Manufacture Date', width: '200px', selector: row => row.manufactureDate?.split('T')[0] },
    { name: 'Owner', selector: row => row.binOwner },
    { name: 'Size', selector: row => `${row.length}*${row.width}*${row.height}` },
    {
      name: 'Action',
      center: true,
      cell: row => (
        <>
          <FaPrint title="Print"
            style={{ color: 'green', cursor: 'pointer', marginRight: 10 }}
            onClick={() => printSingle(row)}
          />

          {partPrivilege.canEdit && (
            <FaEdit title="Edit"
              className="action-icon edit-icon"
              onClick={() => handleEdit(row)}
            />
          )}

          {partPrivilege.canDelete && (
            <FaTrash title="Delete"
              className="action-icon delete-icon"
              onClick={() => {
                setDeleteId(row.id);
                setShowDeleteModal(true);
              }}
            />
          )}
        </>
      )
    }
  ]

  return (
    <div className="binmaster p-3">

      {/* ================= FORM ================= */}
      {showForm && (
        <CCard className="mb-3 ">
          <CCardBody>
            <div className="d-flex justify-content-between mb-3">
              <h5>{editId ? 'Update Packages' : 'Add Packages'}</h5>
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
              <CCol md={3}>
                <label>Part No <span style={{ color: 'red' }}>*</span></label>
                <Select
                  ref={partRef}
                  options={parts.map(p => ({
                    value: p.partNo,
                    label: p.partNo
                  }))}
                  value={
                    parts
                      .map(p => ({ value: p.partNo, label: p.partNo }))
                      .find(opt => opt.value === form.partNo) || null
                  }

                  onChange={(selected) => {
                    // ✅ CLEAR CASE
                    if (!selected) {
                      setForm({
                        ...form,
                        partNo: '',
                        binMaterialType: '',
                        binColor: '',
                        length: '',
                        width: '',
                        height: '',
                        binOwner: ''
                      })
                      return
                    }
                    const p = parts.find(x => x.partNo === selected.value)
                    if (!p) return
                    setForm({
                      ...form,
                      partNo: p.partNo,
                      binMaterialType: p.binMaterialType,
                      binColor: p.binColor,
                      length: p.length,
                      width: p.width,
                      height: p.height,
                      binOwner: p.binOwner
                    })
                  }}
                  placeholder="Select Part No"
                  isSearchable
                  isClearable
                />
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>Packages Material Type</label>
                <CFormInput value={form.binMaterialType} disabled />
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>Packages Color</label>
                <CFormInput value={form.binColor} disabled />
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>
                  Manufacture Date <span style={{ color: 'red' }}>*</span>
                </label>
                <CFormInput
                  type="date"

                  min={new Date().toISOString().split('T')[0]}
                  max={new Date().toISOString().split('T')[0]}

                  value={form.manufactureDate}

                  onChange={(e) => {

                    const today =
                      new Date().toISOString().split('T')[0]

                    // ✅ ONLY TODAY ALLOWED
                    if (e.target.value !== today) {

                      toast.error(
                        'Only today date allowed'
                      )

                      return
                    }

                    setForm({
                      ...form,
                      manufactureDate: e.target.value
                    })
                  }}
                />
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>Size (L*W*H)</label>
                <div className="d-flex gap-2">
                  <CFormInput value={form.length} disabled />
                  <CFormInput value={form.width} disabled />
                  <CFormInput value={form.height} disabled />
                </div>
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>Packages Owner</label>
                <CFormInput value={form.binOwner} disabled />
              </CCol>
              <CCol xs={12} md={6} lg={3}>
                <label>
                  Packages Count <span style={{ color: 'red' }}>*</span>
                </label>
                <CFormInput
                  value={form.binCount || ''}
                  placeholder="Enter Count"

                  onChange={(e) => {
                    const val = e.target.value
                    if (!/^\d*$/.test(val)) {
                      toast.dismiss()
                      toast.error('Only numbers are allowed')
                      return
                    }
                    setForm({
                      ...form,
                      binCount: val
                    })
                  }}
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>
                  Life Cycle Count <span style={{ color: 'red' }}>*</span>
                </label>

                <CFormInput
                  value={form.lifecyclecount || ''}
                  placeholder="Enter Life Cycle Count"
                  onChange={(e) => {
                    const val = e.target.value
                    if (!/^\d*$/.test(val)) {
                      toast.dismiss()
                      toast.error('Only numbers are allowed')
                      return
                    }

                    setForm({
                      ...form,
                      lifecyclecount: val
                    })
                  }}
                />
              </CCol>

              <CCol xs={12} md={6} lg={3}>
                <label>
                  Return Duration <span style={{ color: 'red' }}>*</span>
                </label>

                <CFormInput
                  value={form.returnduration || ''}
                  placeholder="Enter Return Duration"

                  onChange={(e) => {

                    const val = e.target.value

                    if (!/^\d*$/.test(val)) {
                      toast.dismiss()
                      toast.error('Only numbers are allowed')
                      return
                    }

                    setForm({
                      ...form,
                      returnduration: val
                    })
                  }}
                />
              </CCol>

            </CRow>

            <div className="mt-4 text-center">
              <CButton color="success" onClick={handleSubmit}> {editId ? 'Update' : 'Save'}</CButton>
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

      {/* ================= DASHBOARD ================= */}
      <CCard className="mb-3 summary-wrapper">
        <CCardBody>

          <div className="summary-container">

            <div
              className={`summary-card dark ${selectedFilter === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('all')}
            >
              <div className="content">
                <div className="title" style={{ fontSize: '22px', fontWeight: '600' }}>Total Packages</div>
                <div className="value">{counts.total || 0}</div>
              </div>
              <div className="icon">
                <img src={totalBinImg} alt="Total Bin" />
              </div>
            </div>

            <div
              className={`summary-card green ${selectedFilter === 'available' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('available')}
            >
              <div className="content">
                <div className="title" style={{ fontSize: '22px', fontWeight: '600' }}>Available</div>
                <div className="value">{counts.available || 0}</div>
              </div>
              <div className="icon">
                <img src={availableImg} alt="Available Bin" />
              </div>
            </div>

            <div
              className={`summary-card blue ${selectedFilter === 'send' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('send')}
            >
              <div className="content">
                <div className="title" style={{ fontSize: '22px', fontWeight: '600' }}>In Transit</div>
                <div className="value">{counts.transit || 0}</div>
              </div>
              <div className="icon">
                <img src={transitImg} alt="In Transit" />
              </div>
            </div>

            <div
              className={`summary-card red ${selectedFilter === 'damaged' ? 'active' : ''}`}
              onClick={() => setSelectedFilter('damaged')}
            >
              <div className="content">
                <div className="title" style={{ fontSize: '22px', fontWeight: '600' }}>Damaged</div>
                <div className="value">{counts.damaged || 0}</div>
              </div>
              <div className="icon">
                <img src={damaged} alt="In Transit" />
              </div>
            </div>
            {!showForm && (
              <div className="add-btn">
                <CButton
                  shape="rounded-circle"
                  color="dark"
                  onClick={() => {

                    // ✅ Clear everything properly
                    setForm({ ...initialForm });

                    setEditId(null);

                    // ✅ Clear printed QR data
                    setNewBins([]);

                    // ✅ Close and reopen form freshly
                    setShowForm(false);

                    setTimeout(() => {
                      setShowForm(true);
                    }, 100);
                  }}
                >
                  <FaPlus />
                </CButton>
                <div className="add-text">Add</div>
              </div>
            )}

          </div>

        </CCardBody>
      </CCard>
      {/* ================= TABLE ================= */}
      <CCard>
        <CCardBody>
          <h6 className="text-center mb-3" style={{ fontSize: '18px', fontWeight: '600' }}>Packages Details</h6>
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

      {/* ================= QR ================= */}
      {newBins.length > 0 && (
        <CCard className="mt-4">
          <CCardBody>

            <h5 className="text-center mb-3">New Bin QR Labels</h5>

            <div className="qr-grid">
              {newBins.map(item => (
                <div key={item.id} className="qr-card-horizontal">
                  <QRCodeCanvas value={item.binNo} size={65} />
                  <div className="qr-divider"></div>
                  <div className="qr-info">
                    <div><b>{item.binNo}</b></div>
                    <div>{item.partNo}</div>

                    {/* ✅ FIX IMAGE */}
                    <img src={logo} className="qr-logo" />
                  </div>

                </div>
              ))}
            </div>

          </CCardBody>
        </CCard>
      )}

      {newBins.length > 0 && (
        <div className="text-center mt-3">
          <CButton color="success" onClick={printNewBins}>
            Print Labels
          </CButton>
        </div>
      )}

      <div id="print-area"></div>

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
            Are you sure to delete{' '}
            <b>{data.find(d => d.id === deleteId)?.binNo}</b>?
          </p>
        </CModalBody>

        <CModalFooter className="border-0 d-flex justify-content-center gap-2">
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </CButton>

          <CButton color="danger" onClick={confirmDelete} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </CButton>
        </CModalFooter>
      </CModal>
    </div>
  )
}

export default BinMaster