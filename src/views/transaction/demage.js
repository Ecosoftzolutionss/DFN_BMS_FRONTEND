import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
  CCard, CCardBody, CFormInput, CButton,
  CModal, CModalBody, CModalHeader, CModalTitle, CModalFooter
} from '@coreui/react';
import API from '../../api';
import { toast } from 'react-toastify';
import { FaTrash, FaPrint, FaEdit, FaRecycle } from 'react-icons/fa';
import '../../assets/CSS/user.css';
import '../../assets/CSS/send.css';
import '../../assets/CSS/bin.css';
import logo from '../../../src/assets/images/Comlogo.png';
import usePrivilege from '../hooks/usePrivilege.js'

const Damage = () => {

  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState('');
  const [scanValue, setScanValue] = useState('');
  const scanRef = useRef();
  const [deleteBin, setDeleteBin] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modal, setModal] = useState(false);
  const [selectedBin, setSelectedBin] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [modalPage, setModalPage] = useState(1);
  const [modalRowsPerPage, setModalRowsPerPage] = useState(10);
  const [editModal, setEditModal] = useState(false);
  const [scanLock, setScanLock] = useState(false)
  const [editData, setEditData] = useState({
    binNo: '',
    partNo: '',
    binMaterialType: ''
  });
  const [showPartModal, setShowPartModal] = useState(false)
  const [partBins, setPartBins] = useState([])
  const [selectedPartNo, setSelectedPartNo] = useState('')
  const [partSearch, setPartSearch] = useState('')
  const { privileges } = usePrivilege()
  const partPrivilege = privileges.find(p => p.menuName === 'Part') || {}

  useEffect(() => {

    loadData(currentPage, rowsPerPage, search)

  }, [currentPage, rowsPerPage])

  const loadData = async (
    page = currentPage,
    pageSize = rowsPerPage,
    searchPart = ''
  ) => {

    try {

      const res = await API.get('/damage', {
        params: {
          page,
          pageSize,
          partNo: searchPart
        }
      })

      setData(res.data.data)
      setFilteredData(res.data.data)

    } catch (err) {

      toast.error("Failed to load data")

    }
  }

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


  const getBase64Image = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'

      img.onload = function () {
        const canvas = document.createElement('canvas')
        canvas.width = this.width
        canvas.height = this.height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(this, 0, 0)

        const dataURL = canvas.toDataURL('image/png')
        resolve(dataURL)
      }

      img.onerror = reject
      img.src = url
    })
  }

  // // ✅ FILTER
  // useEffect(() => {
  //   const result = data.filter(item =>
  //     item.partNo?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.binNo?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.binMaterialType?.toLowerCase().includes(search.toLowerCase()) ||
  //     item.binOwner?.toLowerCase().includes(search.toLowerCase())
  //   )
  //   setFilteredData(result)
  // }, [search, data])

  const handleScan = async (value) => {

    // ✅ PREVENT DOUBLE API CALL
    if (scanLock) return

    setScanLock(true)

    try {

      const res = await API.get(`/damage/scan/${value}`)

      setSelectedBin(res.data)
      setModal(true)
      setScanValue('')

    } catch (err) {

      // ✅ REMOVE OLD TOAST
      toast.dismiss()

      toast.error(err.response?.data || "Invalid Bin")

    } finally {

      // ✅ CLEAR INPUT
      setScanValue('')

      // ✅ FOCUS AGAIN
      setTimeout(() => {

        setScanLock(false)

        scanRef.current?.focus()

      }, 300)
    }
  }

  const handleScrap = async () => {
    await API.delete(`/damage/scrap/${selectedBin.binNo}`)
    toast.success("Bin Scrapped")
    setModal(false)
    loadData()
  }

  const handleReuse = async () => {
    await API.post(`/damage/reuse/${selectedBin.binNo}`)
    toast.success("Bin Reused")
    setModal(false)
    loadData()
  }

  // ✅ DELETE
  // OPEN DELETE MODAL
  const handleDeleteClick = (binNo) => {
    setDeleteBin(binNo)
    setShowDeleteModal(true)
  }

  // CONFIRM DELETE
  const confirmDelete = async () => {
    try {
      await API.delete(`/damage/scrap/${deleteBin}`)
      toast.success("Deleted Successfully")
      loadData()
    } catch {
      toast.error("Delete Failed")
    } finally {
      setShowDeleteModal(false)
      setDeleteBin('')
    }
  }

  // ✅ PRINT
  const handlePrint = async (row) => {

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${row.binNo}`

    const logoBase64 = await getBase64Image(logo)

    const printWindow = window.open('', '_blank')

    printWindow.document.write(`
    <html>
      <head>
        <style>
          @page { size: 5cm 2.5cm; margin: 0; }

          body {
            margin: 0;
            padding: 4px;
            font-family: Arial;
          }

          .label {
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .qr {
            width: 1.2cm;
          }

          .logo {
            width: 0.7cm;
            margin-top: 2px;
          }

          .text {
            font-size: 9px;
          }
        </style>
      </head>

      <body>
        <div class="label">
          <img class="qr" src="${qrUrl}" />

          <div class="text">
            <div><b>${row.binNo}</b></div>
            <div>${row.partNo || ''}</div>
            <img class="logo" src="${logoBase64}" />
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
    </html>
  `)

    printWindow.document.close()
  }

  //   // ✅ EDIT CLICK
  //   const handleEdit = (row) => {
  //     setEditData(row)
  //     setEditModal(true)
  //   }

  // ✅ UPDATE
  const handleUpdate = async () => {
    await API.put(`/damage/${editData.binNo}`, editData)
    toast.success("Updated Successfully")
    setEditModal(false)
    loadData()
  }

  const columns = [

    {
      name: 'S.No',
      cell: (row, index) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      width: '100px'
    },

    {
      name: 'Part No',

      cell: row => (

        <span
          style={{
            color: '#0d6efd',
            cursor: 'pointer',
            fontWeight: '600'
          }}
          onClick={() => openPartBins(row.partNo)}
        >
          {row.partNo}
        </span>
      )
    },

    {
      name: 'Packages Count',
      selector: row => row.binCount,
      center: true
    }
  ]


  const openPartBins = async (partNo) => {

    setPartSearch('')

    const filtered =
      data.filter(x => x.partNo === partNo)

    setPartBins(filtered)

    setSelectedPartNo(partNo)

    setShowPartModal(true)
  }

  const groupedData =
    Object.values(

      filteredData.reduce((acc, item) => {

        if (!acc[item.partNo]) {

          acc[item.partNo] = {
            partNo: item.partNo,
            binCount: 0
          }
        }

        acc[item.partNo].binCount += 1

        return acc

      }, {})
    )

  useEffect(() => {

    scanRef.current?.focus()

  }, [])


  const focusScanInput = () => {

    setTimeout(() => {

      scanRef.current?.focus()

    }, 100)
  }
  return (
    <div className="send-page p-3">
      <CModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        alignment="center"
        backdrop="static"
      >
        <CModalHeader>
          <CModalTitle className="text-danger w-100 text-center">
            ⚠ Confirm Delete
          </CModalTitle>
        </CModalHeader>

        <CModalBody className="text-center">
          Are you sure to delete <b>{deleteBin}</b>?
        </CModalBody>

        <CModalFooter className="d-flex justify-content-center">
          <CButton color="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancel
          </CButton>
          <CButton color="danger" onClick={confirmDelete}>
            Delete
          </CButton>
        </CModalFooter>
      </CModal>

      <CCard>
        <CCardBody>
          <div className="scan-box">
            <div className="scan-inner">

              <span className="scan-icon">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2d3e50"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3H5a2 2 0 0 0-2 2v1" />
                  <path d="M18 3h1a2 2 0 0 1 2 2v1" />
                  <path d="M21 18v1a2 2 0 0 1-2 2h-1" />
                  <path d="M3 18v1a2 2 0 0 0 2 2h1" />

                  <rect x="7" y="7" width="3" height="3" />
                  <rect x="14" y="7" width="3" height="3" />
                  <rect x="7" y="14" width="3" height="3" />
                </svg>
              </span>

              <input
                ref={scanRef}
                value={scanValue}
                autoFocus
                placeholder="Scan or Enter Packages No"

                onFocus={() =>
                  setTimeout(() => scanRef.current?.select(), 50)
                }

                onKeyDown={(e) => {

                  if (e.key === 'Enter') {

                    e.preventDefault()

                    focusScanInput()
                  }
                }}


                onChange={(e) => {

                  const val = e.target.value
                    .replace(/\$/g, '')
                    .replace(/Shift/g, '')
                    .replace(/[^A-Za-z0-9]/g, '')
                    .trim()
                    .toUpperCase()

                  setScanValue(val)

                  if (val.length >= 8) {

                    const finalValue = val.slice(-8)

                    setScanValue('')

                    handleScan(finalValue)
                  }
                }}
              />

            </div>
          </div>
        </CCardBody>
      </CCard>

      {/* GRID */}
      <CCard className="mt-3">
        <CCardBody>
          <h6 className="text-center mb-3" style={{ fontSize: '18px', fontWeight: '600' }}>Damage Packages Details</h6>
          <div className="d-flex flex-column flex-md-row justify-content-between mb-2 gap-2">
            <div></div>
            <CFormInput
              placeholder="Search..."
              className="w-100 w-md-auto"
              style={{ maxWidth: '250px' }}
              tabIndex={0}
              value={search}
              onChange={(e) => {

                setSearch(e.target.value)

                loadData(
                  1,
                  rowsPerPage,
                  e.target.value
                )
              }}
            />
          </div>

          <DataTable
            columns={columns}
            data={
              Object.values(

                filteredData.reduce((acc, item) => {

                  if (!acc[item.partNo]) {

                    acc[item.partNo] = {
                      partNo: item.partNo,
                      binCount: 0
                    }
                  }
                  acc[item.partNo].binCount += 1

                  return acc

                }, {})
              )
            }
            pagination
            paginationServer
            paginationTotalRows={filteredData.length}
            highlightOnHover
            striped
            responsive
            customStyles={customStyles}
            persistTableHead
            onChangePage={(page) => {

              setCurrentPage(page)

              loadData(page, rowsPerPage, search)
            }}
            onChangeRowsPerPage={(newPerPage, page) => {

              setRowsPerPage(newPerPage)
              setCurrentPage(page)

              loadData(page, newPerPage, search)
            }}
          />
        </CCardBody>
      </CCard>

      <CModal
        visible={showPartModal}
        size="xl"
        onClose={() => {
          setShowPartModal(false)
          setPartSearch('')

          // ✅ Focus back to scan input
          setTimeout(() => {
            scanRef.current?.focus()
          }, 200)
        }}
      >

        <CModalHeader>
          <CModalTitle>
            📦 Part No : {selectedPartNo}
          </CModalTitle>
        </CModalHeader>

        <CModalBody>

          <div className="d-flex justify-content-end mb-2">
            <CFormInput
              placeholder="Search..."
              style={{ width: '220px' }}
              value={partSearch}
              onChange={(e) => setPartSearch(e.target.value)}
            />
          </div>

          <DataTable
            columns={[
              {
                name: 'S.No',
                cell: (row, index) =>
                  (modalPage - 1) * modalRowsPerPage + index + 1,
                width: '90px'
              },

              {
                name: 'Part No',
                selector: row => row.partNo
              },

              {
                name: 'Packages No',
                selector: row => row.binNo
              }
            ]}

            data={
              partBins.filter(item =>

                item.partNo?.toLowerCase()
                  .includes(partSearch.toLowerCase())

                ||

                item.binNo?.toLowerCase()
                  .includes(partSearch.toLowerCase())
              )
            }
            pagination
            striped
            responsive
            highlightOnHover
            customStyles={customStyles}
            persistTableHead
            onChangePage={(page) => setModalPage(page)}
            onChangeRowsPerPage={(newPerPage, page) => {
              setModalRowsPerPage(newPerPage)
              setModalPage(page)
            }}
          />

        </CModalBody>

      </CModal>
      {/* SCAN MODAL */}
      <CModal visible={modal} onClose={() => setModal(false)}>
        <CModalHeader>
          <CModalTitle>Packages Details</CModalTitle>
        </CModalHeader>
        <CModalBody>

          <div className="row mb-2">
            <div className="col-6 fw-bold">Packages No</div>
            <div className="col-6 text-end">{selectedBin?.binNo}</div>
          </div>

          <div className="row mb-2">
            <div className="col-6 fw-bold">Part No</div>
            <div className="col-6 text-end">{selectedBin?.partNo}</div>
          </div>

          <div className="row mb-3">
            <div className="col-6 fw-bold">Material</div>
            <div className="col-6 text-end">{selectedBin?.binMaterialType}</div>
          </div>

          <div className="d-flex flex-column flex-md-row justify-content-center gap-2">
            <CButton color="danger" onClick={handleScrap}>
              <FaTrash className="me-1" /> Scrap
            </CButton>

            <CButton color="success" onClick={handleReuse}>
              <FaRecycle className="me-1" /> Reuse
            </CButton>
          </div>

        </CModalBody>
      </CModal>
      <CModal visible={editModal} onClose={() => setEditModal(false)}>
        <CModalHeader>
          <CModalTitle>Edit Packages</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <CFormInput
            label="Part No"
            value={editData.partNo}
            onChange={(e) => setEditData({ ...editData, partNo: e.target.value })}
            className="mb-2"
          />

          <CFormInput
            label="Material"
            value={editData.binMaterialType}
            onChange={(e) => setEditData({ ...editData, binMaterialType: e.target.value })}
          />
        </CModalBody>

        <CModalFooter>
          <CButton color="secondary" onClick={() => setEditModal(false)}>
            Cancel
          </CButton>

          <CButton color="primary" onClick={handleUpdate}>
            Update
          </CButton>
        </CModalFooter>
      </CModal>

    </div>
  )
}

export default Damage