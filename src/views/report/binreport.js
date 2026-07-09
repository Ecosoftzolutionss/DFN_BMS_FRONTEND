import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component'
import {CCard, CCardBody, CFormInput, CButton, CFormSelect, CRow, CCol, CTooltip} from '@coreui/react';
import { FaFileExcel, FaSearch } from 'react-icons/fa';
import API from '../../api';
import '../../assets/CSS/user.css';
import '../../assets/CSS/binsummary.css';
import Select from 'react-select';
import { toast } from 'react-toastify';

const BinReport = () => {
  const fromDateRef = useRef();
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [data, setData] = useState([]);
  const [partList, setPartList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    partNo: ''
  });
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
  useEffect(() => {
    loadParts()
    loadSummary()
  }, [])

  useEffect(() => {
    setTimeout(() => {
      fromDateRef.current?.focus()
    }, 100)
  }, [])

  const loadParts = async () => {
    const res = await API.get('/parts')
    setPartList(res.data)
  }

  const loadSummary = async () => {
    try {
      const res = await API.get('/reports/summary', {
        params: filters
      })
      if (!res.data.success) {
        setData([])
        toast.info(
          res.data.message || 'No data available for selected date range'
        )
        return
      }
      setData(res.data.data || [])
    } catch (err) {
      setData([])
      toast.error('Failed to load report data')
    }
  }


  const handleSearch = () => loadSummary()

  const handleClear = async () => {
    try {
      const emptyFilters = {
        fromDate: '',
        toDate: '',
        partNo: ''
      }
      setFilters(emptyFilters)
      const res = await API.get('/reports/summary', {
        params: emptyFilters
      })

      setData(res.data.data || [])
      setSearchText('')
    } catch (err) {

      setData([])

      toast.error('Failed to clear report data')
    }
  }

  // ✅ SEARCH FILTER
  const filteredData = data.filter(item =>
    Object.values(item).join(' ').toLowerCase().includes(searchText.toLowerCase())
  )

  // ✅ EXPORT FIX (NO ERROR IF EMPTY)
  const exportToExcel = () => {
    if (data.length === 0) return
    const headers = Object.keys(data[0]).join(',')
    const rows = data.map(row => Object.values(row).join(','))
    const csv = [headers, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'BinReport.csv'
    a.click()
  }
  const tooltipCell = (value) => (
    <CTooltip content={value || '-'}>
      <div
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}
      >
        {value || '-'}
      </div>
    </CTooltip>
  )
  // ✅ SUMMARY TABLE
  const summaryColumns = [
    {
      name: 'S.No',
      selector: (row, index) =>
        (currentPage - 1) * rowsPerPage + index + 1,
      width: '90px'
    },
    { name: 'RDC ID', selector: r => r.rdc, width: '200px' },
    { name: 'Part No', cell: r => tooltipCell(r.partNo), width: '200px' },
    { name: 'Packages No', selector: r => r.binNo, width: '130px' },
    { name: 'Customer', cell: r => tooltipCell(r.customer), width: '200px' },
    { name: 'Reference No', cell: r => tooltipCell(r.referenceNo), width: '200px' },
    { name: 'Vehicle No', cell: r => tooltipCell(r.vehicleNo), width: '200px' },
    { name: 'Driver Name', cell: r => tooltipCell(r.driverName), width: '130px' },
    { name: 'Driver No', cell: r => tooltipCell(r.driverNo), width: '150px' },
    { name: 'Date & Time', cell: r => tooltipCell(r.scanDateTime), width: '240px' },
    {
      width: '160px',
      name: 'Transaction Type',
      cell: r => (
        <span style={{
          color: r.type === 'Send' ? '#0d6efd' : '#fd7e14',
          fontWeight: '600'
        }}>
          {r.type}
        </span>
      )

    },

    {
      width: '160px',
      name: 'Packages Status',
      cell: r => (
        <span style={{
          color: r.status === 'Available' ? 'green' : '#6f42c1',
          fontWeight: '600'
        }}>
          {r.status}
        </span>
      )
    },

    {
      width: '200px',
      name: 'Packages Conditions',
      cell: r => (
        <span style={{
          color:
            r.condition === 'Good' ? 'green' :
              r.condition === 'Repair' ? '#fd7e14' : 'red',
          fontWeight: '600'
        }}>
          {r.condition}
        </span>
      )
    }
  ]

  return (
    <div className="p-3">
      <CCard className="mb-3 shadow-sm">
        <CCardBody>
          <CRow className="g-3 align-items-end">
            <CCol xs={12} md={4}>
              <label>From Date</label>
              <CFormInput
                ref={fromDateRef}
                type="date"
                value={filters.fromDate}
                onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </CCol>

            <CCol xs={12} md={4}>
              <label>To Date</label>
              <CFormInput
                type="date"
                value={filters.toDate}
                onChange={e => setFilters({ ...filters, toDate: e.target.value })}
              />
            </CCol>

            <CCol xs={12} md={4}>
              <label>Part No</label>
              <Select
                options={partList.map(p => ({
                  value: p.partNo,
                  label: p.partNo
                }))}

                value={
                  partList
                    .map(p => ({ value: p.partNo, label: p.partNo }))
                    .find(opt => opt.value === filters.partNo) || null
                }

                onChange={(selected) => {
                  setFilters({
                    ...filters,
                    partNo: selected ? selected.value : ''
                  })
                }}

                placeholder="Select Part No"
                isSearchable
                isClearable
              />
            </CCol>

            <CCol xs={12} className="text-center">
              <CButton color="success" onClick={handleSearch}>Search</CButton>
              <CButton color="secondary" className="ms-2" onClick={handleClear}>Clear</CButton>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* 🔷 SUMMARY */}
      <CCard className="mb-3 shadow-sm">
        <CCardBody>
          <div
            className="d-flex justify-content-end align-items-center mb-2 flex-wrap gap-2"
            style={{ position: 'relative' }}
          >
            <h6
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '18px',
                fontWeight: '600',
                margin: 0
              }}
            >
              Packages Summary Details
            </h6>
            <div className="d-flex gap-2 align-items-center">
              <CButton color="success" size="sm" onClick={exportToExcel}>
                <FaFileExcel /> Export to Excel
              </CButton>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control ps-4"
                  placeholder="Search here"
                  style={{ height: '32px' }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DataTable
            columns={summaryColumns}
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
            noDataComponent={
              <div style={{ padding: '20px', fontSize: '16px' }}>
                No records found for selected date range
              </div>
            }
          />
        </CCardBody>
      </CCard>
    </div>
  )
}

export default BinReport