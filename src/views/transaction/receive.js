import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import {
    CRow, CCol, CFormSelect, CFormInput,
    CButton, CCard, CCardBody, CModal,
    CModalHeader, CModalTitle, CModalBody, CModalFooter, CTooltip
} from '@coreui/react';
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import API from '../../api';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import '../../assets/CSS/send.css';
import '../../assets/CSS/user.css';
import usePrivilege from '../hooks/usePrivilege.js'
import totalBinImg from '../../assets/images/Total Bin.png'
import availableImg from '../../assets/images/Available Bin.png';
import damaged from '../../assets/images/Damaged.png';




const Receive = () => {
    const customerRef = useRef();
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        customerId: '',
        vehicleId: '',
        vehicleNoInput: '',
        driverName: '',
        driverNo: '',
        referenceNo: '',
        binNo: '',
        condition: 'Good',
        remarks: ''
    });
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [data, setData] = useState([]);
    const [search, setSearch] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [page, setPage] = useState(1);
    const [deleteBinNo, setDeleteBinNo] = useState('');
    const scanRef = React.useRef();
    const [scanValue, setScanValue] = useState('');
    const [lastScanned, setLastScanned] = useState('');
    const [totalRows, setTotalRows] = useState(0);
    const [binList, setBinList] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [modalPage, setModalPage] = useState(1)
    const [modalRowsPerPage, setModalRowsPerPage] = useState(10)
    const [scanPage, setScanPage] = useState(1)
    const [scanRowsPerPage, setScanRowsPerPage] = useState(10)
    const [scanLock, setScanLock] = useState(false);
    const [counts, setCounts] = useState({
        total: 0,
        available: 0,
        damaged: 0,
        customer: 0
    });
    const [showTransactionModal, setShowTransactionModal] = useState(false)
    const [transactionBins, setTransactionBins] = useState([])
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const [transactionSearch, setTransactionSearch] = useState('')
    const [pendingScan, setPendingScan] = useState(null)
    const [showMismatchPopup, setShowMismatchPopup] = useState(false)
    const { privileges } = usePrivilege()
    const partPrivilege = privileges.find(p => p.menuName === 'Part') || {}

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
                paddingTop: '4px',
                paddingBottom: '4px',
            },
        },
    }

    useEffect(() => {
        loadAll()
    }, [])


    const loadAll = async (pageNo = 1) => {
        const d = await API.get(`/receive?page=${pageNo}&pageSize=10`)
        setData(d.data.data)
        setTotalRows(d.data.totalCount)

        const c = await API.get('/receive/customers-with-send')
        const v = await API.get('/receive/vehicles-with-send')
        const cnt = await API.get('/send/counts')

        setCustomers(c.data)
        setVehicles(v.data)
        setCounts(cnt.data)
    }
    useEffect(() => {
        if (showForm) {
            setTimeout(() => {
                customerRef.current?.focus()
            }, 100)
        }
    }, [showForm])

    // ✅ VEHICLE AUTO FILL
    const handleVehicle = (id) => {
        const v = vehicles.find(x => x.id == id)

        setForm(prev => ({
            ...prev,
            vehicleId: id,
            // driverName: v?.driverName || '',
            // driverNo: v?.driverNo || ''
        }))
    }

    // ✅ SCAN
    const handleScan = (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim()
            if (!val) return toast.error('Invalid Bin')
            setForm(prev => ({ ...prev, binNo: val }))
            e.target.value = ''
        }
    }


    // ✅ ADD ONE SCANNED BIN TO THE GRID
    const addScannedRow = (binNo, partNo, customerId, customerName) => {
        const vehicle = vehicles.find(v => v.id == form.vehicleId)

        const newRow = {
            partNo,
            binNo,
            customerId,
            customerName: customerName || '',
            vehicleId: form.vehicleId,
            referenceNo: form.referenceNo,
            vehicleNo:
                vehicle?.vehicleNo ||
                form.vehicleNoInput ||
                '',
            driverName: form.driverName,
            driverNo: form.driverNo,
            condition: form.condition,
            remarks: form.remarks,
            scanDateTime: new Date().toLocaleString()
        }

        setBinList(prev => {
            if (prev.some(x => x.binNo === binNo)) {
                return prev
            }
            return [...prev, newRow]
        })
        setLastScanned(binNo)
        setIsLocked(true)
    }

    // ✅ USER CONFIRMED: label belongs to another customer
    // the bin is saved under the customer it was actually sent to,
    // so it becomes its own transaction
    const confirmMismatch = () => {
        if (pendingScan && !binList.some(x => x.binNo === pendingScan.binNo)) {
            addScannedRow(
                pendingScan.binNo,
                pendingScan.partNo,
                pendingScan.customerId,
                pendingScan.customerName
            )
        }
        setShowMismatchPopup(false)
        setPendingScan(null)
        setTimeout(() => scanRef.current?.focus(), 100)
    }

    const cancelMismatch = () => {
        setShowMismatchPopup(false)
        setPendingScan(null)
        setTimeout(() => scanRef.current?.focus(), 100)
    }

    const processScan = async (value) => {

        // ✅ PREVENT DOUBLE SCAN
        if (scanLock) return
        setScanLock(true)
        value = value
            ?.replace(/[^A-Za-z0-9]/g, '')
            ?.trim()
            ?.toUpperCase()
        if (!value) {
            setScanLock(false)
            return
        }

        // ✅ VALIDATION
        if (
            !form.customerId ||
            (!form.vehicleId && !form.vehicleNoInput) ||
            !form.referenceNo ||
            !form.driverName ||
            !form.driverNo
        ) {
            toast.dismiss()

            toast.error(
                'Fill all required fields'
            )

            setScanValue('')
            setScanLock(false)

            return
        }


        if (!/^\d{10}$/.test(form.driverNo)) {
            toast.error('Driver No must be 10 digits')
            setScanValue('')
            setScanLock(false)
            return
        }
        // ✅ DUPLICATE CHECK
        if (binList.some(x => x.binNo === value)) {
            toast.dismiss()
            toast.error('Already scanned')
            setScanValue('')
            setScanLock(false)
            return
        }

        try {

            const res = await API.get(
                `/receive/get-bin/${value}/${form.customerId}`
            )
            const alreadyExists = binList.some(x => x.binNo === value)
            if (alreadyExists) {
                toast.error('Already scanned')
                setScanLock(false)
                return
            }

            // ✅ LABEL BELONGS TO ANOTHER CUSTOMER - ask before adding
            if (res.data.requiresConfirmation) {
                setPendingScan({
                    binNo: value,
                    partNo: res.data.partNo,
                    customerId: res.data.belongsToCustomerId,
                    customerName: res.data.belongsToCustomerName,
                    message: res.data.message
                })
                setShowMismatchPopup(true)
                return
            }

            const selectedCustomer = customers.find(c => c.id == form.customerId)

            addScannedRow(
                value,
                res.data.partNo,
                form.customerId,
                selectedCustomer?.customerName
            )

        } catch (err) {
            console.error(err)
            const errorMessage =
                err?.response?.data ||
                err?.response?.data?.message ||
                err?.message ||
                "Invalid Bin"
            toast.dismiss()
            toast.error(errorMessage)
        }
        finally {
            setScanValue('')
            setTimeout(() => {
                setScanLock(false)
                scanRef.current?.focus()
            }, 300)
        }
    }

    const handleSave = async () => {
        if (
            !form.customerId ||
            (!form.vehicleId && !form.vehicleNoInput) ||
            !form.referenceNo ||
            !form.driverName ||
            !form.driverNo
        ) {
            return toast.error('Fill required fields')
        }

        if (!/^\d{10}$/.test(form.driverNo)) {
            return toast.error('Invalid Driver No')
        }
        try {
            if (isEdit) {
                await API.put(`/receive/${editId}`, form)
                toast.success("Updated Successfully")
            } else {
                if (binList.length === 0)
                    return toast.error("Scan at least one bin")
                const payload = {
                    bins: binList.map(x => ({
                        binNo: x.binNo,
                        referenceNo: x.referenceNo,
                        customerId: x.customerId,
                        vehicleId: x.vehicleId
                            ? Number(x.vehicleId)
                            : 0,

                        vehicleNoInput: form.vehicleNoInput || '',
                        driverName: x.driverName,
                        driverNo: x.driverNo,
                        condition: x.condition,
                        remarks: x.remarks
                    }))
                }
                await API.post('/receive/bulk', payload)
                toast.success("Bins Received Successfully")
            }

            // setShowForm(false)
            setIsEdit(false)
            setEditId(null)

            setForm({
                customerId: '',
                vehicleId: '',
                driverName: '',
                driverNo: '',
                vehicleNoInput: '',
                referenceNo: '',
                binNo: '',
                condition: 'Good',
                remarks: ''
            })

            setBinList([])
            setScanValue('')
            setLastScanned('')
            setIsLocked(false)

            loadAll()

            setTimeout(() => {
                customerRef.current?.focus()
            }, 100)

        } catch (err) {
            toast.error(err.response?.data || "Error")
        }
    }

    const handleGridEdit = (row, index) => {
        // remove from grid
        setBinList(prev => prev.filter((_, i) => i !== index))

        // put value in scan input
        setScanValue('')

        // focus scan
        setTimeout(() => {
            scanRef.current?.focus()
        }, 100)
    }

    const handleEdit = (row) => {
        const vehicle = vehicles.find(v => v.id == row.vehicleId)

        setForm({
            customerId: String(row.customerId),
            vehicleId: String(row.vehicleId),
            vehicleNoInput:
                row.vehicleNo ||
                vehicle?.vehicleNo ||
                '',
            referenceNo: row.referenceNo,
            condition: row.condition || "Good",
            remarks: row.remarks || '',
            driverName: row.driverName || '',
            driverNo: row.driverNo || ''
        })

        setEditId(row.id)     // ✅ store id
        setIsEdit(true)       // ✅ edit mode
        setShowForm(true)
    }

    // ✅ DELETE
    const confirmDelete = async () => {
        await API.delete(`/receive/${deleteId}`)
        toast.success('Bin Deleted Successfully')

        // ✅ clear if deleted record is currently editing
        if (isEdit && deleteId === editId) {
            handleClear()
            setIsEdit(false)
            setEditId(null)
            setShowForm(false)   // or true (your choice)
        }

        await loadAll()
        setShowDeleteModal(false)
        setShowTransactionModal(false)
    }

    // ✅ CLEAR
    const handleClear = () => {
        setForm({
            customerId: '',
            vehicleId: '',
            driverName: '',
            driverNo: '',
            referenceNo: '',
            vehicleNoInput: '',
            binNo: '',
            condition: 'Good',
            remarks: ''
        });

        setBinList([]);
        setScanValue('');
        setLastScanned('');
        setIsLocked(false);

        setIsEdit(false);     // ✅ ADD THIS
        setEditId(null);      // ✅ ADD THIS

        scanRef.current?.focus();
    }
    // ✅ FILTER (one row per receive transaction, same as Send)
    const filteredData = data.filter(item =>
        item.transactionId?.toString().includes(search) ||
        item.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        item.referenceNo?.toLowerCase().includes(search.toLowerCase()) ||
        item.vehicleNo?.toLowerCase().includes(search.toLowerCase()) ||
        item.driverName?.toLowerCase().includes(search.toLowerCase()) ||
        item.driverNo?.toString().includes(search)
    )

    // ✅ OPEN BINS OF ONE TRANSACTION
    const openTransaction = async (batchId) => {
        try {
            setTransactionSearch('')
            const res = await API.get(`/receive/transaction-details/${batchId}`)
            setTransactionBins(res.data)
            setSelectedTransaction(batchId)
            setShowTransactionModal(true)
        } catch (err) {
            toast.error('Failed to load transaction')
        }
    }

    const filteredTransactionBins = transactionBins.filter(item =>
        item.partNo?.toString().toLowerCase().includes(transactionSearch.toLowerCase()) ||
        item.binMaterialType?.toLowerCase().includes(transactionSearch.toLowerCase()) ||
        item.binNo?.toLowerCase().includes(transactionSearch.toLowerCase())
    )
    // const columns = [
    //     { name: 'S.No', selector: (r, i) => i + 1 },
    //     { name: 'Part No', selector: r => r.partNo },
    //     { name: 'Bin No', selector: r => r.binNo },
    //     { name: 'Reference No', selector: r => r.referenceNo, width: '200px' },
    //     { name: 'Vehicle No', selector: r => r.vehicleNo },
    //     { name: 'Driver Name', selector: r => r.driverName },
    //     { name: 'Driver No', selector: r => r.driverNo },

    //     {
    //         name: 'Condition',
    //         cell: r => (
    //             <span style={{ color: r.condition === 'Damaged' ? 'red' : 'green' }}>
    //                 {r.condition}
    //             </span>
    //         )
    //     },

    //     { name: 'Remarks', selector: r => r.remarks },

    //     {
    //         name: 'Action',
    //         cell: row => (
    //             <>
    //                 {partPrivilege.canEdit && (

    //                     <FaEdit
    //                         className="action-icon edit-icon"
    //                         onClick={() => handleEdit(row)}
    //                     />)}
    //                 {partPrivilege.canDelete && (

    //                     <FaTrash
    //                         className="action-icon delete-icon"
    //                         onClick={() => {
    //                             setDeleteId(row.id);
    //                             setDeleteBinNo(row.binNo); // ✅ important
    //                             setShowDeleteModal(true);
    //                         }}
    //                     />)}
    //             </>

    //         )
    //     }
    // ]

    const columns = [
        {
            name: 'Transaction ID',
            width: '200px',
            cell: row => (
                <span
                    style={{
                        color: '#0d6efd',
                        cursor: 'pointer',
                        fontWeight: '600'
                    }}
                    onClick={() => openTransaction(row.transactionId)}
                >
                    {row.transactionId}
                </span>
            )
        },
        {
            name: 'Customer Name',
            selector: r => r.customerName,
            width: '220px'
        },
        {
            name: 'Packages Count',
            selector: r => r.binCount,
            width: '200px',
            center: true
        },
        {
            name: 'Reference No',
            selector: r => r.referenceNo,
            width: '200px'
        },
        {
            name: 'Vehicle No',
            selector: r => r.vehicleNo
        },
        {
            name: 'Driver Name',
            selector: r => r.driverName,
            width: '200px'
        },
        {
            name: 'Driver No',
            selector: r => r.driverNo
        },
        {
            name: 'Receive Date',
            cell: r => {
                const d = new Date(r.scanDateTime)

                return `${d.getDate().toString().padStart(2, '0')}-` +
                    `${(d.getMonth() + 1).toString().padStart(2, '0')}-` +
                    `${d.getFullYear()} ` +
                    `${d.toLocaleTimeString()}`
            },
            width: '300px'
        }
    ]

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

    return (
        <div className="send-page p-3">
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
                        Are you sure you want to delete Bin{" "}
                        <b style={{ color: 'red' }}>{deleteBinNo}</b>?
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
                visible={showMismatchPopup}
                onClose={cancelMismatch}
                alignment="center"
                backdrop="static"
            >
                <CModalHeader className="border-0 pb-0">
                    <CModalTitle className="w-100 text-center fw-bold text-danger">
                        ⚠ Different Customer
                    </CModalTitle>
                </CModalHeader>

                <CModalBody className="text-center pt-2">
                    <div style={{ fontSize: '18px', marginBottom: '12px' }}>
                        Package
                        <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: '6px' }}>
                            {pendingScan?.binNo}
                        </span>
                    </div>
                    <div style={{ fontSize: '16px', color: '#555' }}>
                        {pendingScan?.message}
                    </div>
                    <div style={{ marginTop: '12px', fontSize: '16px' }}>
                        Belongs to: <b>{pendingScan?.customerName}</b>
                    </div>
                </CModalBody>

                <CModalFooter className="border-0 justify-content-center">
                    <CButton
                        color="secondary"
                        size="lg"
                        style={{ minWidth: '120px', fontWeight: '600' }}
                        onClick={cancelMismatch}
                    >
                        No
                    </CButton>
                    <CButton
                        color="success"
                        size="lg"
                        style={{ minWidth: '120px', fontWeight: '600' }}
                        onClick={confirmMismatch}
                    >
                        Yes
                    </CButton>
                </CModalFooter>
            </CModal>

            {!showForm && (
                <CCard className="mb-3 summary-wrapper">
                    <CCardBody>

                        <div className="wsummary-container">
                            <div className="summary-card total-card">
                                <div>
                                    <div className="title">Total Packages</div>
                                    <div className="value">{counts.total || 0}</div>
                                </div>
                                <div className="summary-icon">
                                    <img src={totalBinImg} alt="Total Bin" />
                                </div>
                            </div>

                            <div className="summary-card available-card">
                                <div className="content">
                                    <div className="title">Available</div>
                                    <div className="value">
                                        {counts.available || 0}
                                    </div>
                                </div>
                                <div className="summary-icon">
                                    <img src={availableImg} alt="Total Bin" />
                                </div>
                            </div>

                            <div className="summary-card damaged-card">
                                <div className="content">
                                    <div className="title">Damaged</div>
                                    <div className="value">
                                        {counts.damaged || 0}
                                    </div>
                                </div>
                                <div className="summary-icon">
                                    <img src={damaged} alt="Total Bin" />
                                </div>
                            </div>

                            <div className="summary-card atcustomer-card">
                                <div className="content">
                                    <div className="title">Received</div>
                                    <div className="value">{counts.received || 0}</div>
                                </div>
                                <div className="summary-icon">
                                    <img src={totalBinImg} alt="Total Bin" />
                                </div>
                            </div>

                            <div className="add-btn">
                                <CButton
                                    shape="rounded-circle"
                                    color="dark"
                                    onClick={() => {
                                        handleClear();
                                        setIsEdit(false);
                                        setEditId(null);
                                        setShowForm(true);
                                    }}
                                >
                                    <FaPlus />
                                </CButton>
                                <div className="add-text">Add</div>
                            </div>

                        </div>

                    </CCardBody>
                </CCard>
            )}

            {/* FORM */}
            {showForm && (
                <CCard>
                    <CCardBody>
                        <div className="form-header">
                            <h5>{isEdit ? "Update Packages" : "Receive Packages"}</h5>
                            <CButton color="light" onClick={() => {
                                handleClear()
                                setIsEdit(false)
                                setEditId(null)
                                setShowForm(false)
                            }}>
                                ← Back
                            </CButton>
                        </div>
                        <CRow className="g-3">

                            <CCol xs={12} md={4}>
                                <label>Customer <span className="req">*</span></label>

                                <Select
                                    ref={customerRef}
                                    options={customers.map(c => ({
                                        value: c.id,
                                        label: c.customerName
                                    }))}
                                    value={customers
                                        .map(c => ({ value: c.id, label: c.customerName }))
                                        .find(opt => opt.value == form.customerId) || null
                                    }
                                    onChange={(selected) =>
                                        setForm({ ...form, customerId: selected?.value })
                                    }
                                    placeholder="Search Customer..."
                                    isDisabled={isLocked && binList.length > 0}
                                    isClearable
                                />
                            </CCol>

                            <CCol xs={12} md={4}>
                                <label>Vehicle No <span className="req">*</span></label>

                                <CreatableSelect
                                    options={vehicles.map(v => ({
                                        value: v.id,
                                        label: v.vehicleNo
                                    }))}

                                    value={
                                        form.vehicleId
                                            ? (
                                                vehicles
                                                    .map(v => ({
                                                        value: v.id,
                                                        label: v.vehicleNo
                                                    }))
                                                    .find(opt => opt.value == form.vehicleId)
                                                || {
                                                    value: form.vehicleId,
                                                    label: form.vehicleNoInput
                                                }
                                            )
                                            : form.vehicleNoInput
                                                ? {
                                                    label: form.vehicleNoInput,
                                                    value: form.vehicleNoInput
                                                }
                                                : null
                                    }

                                    onChange={(selected) => {

                                        if (!selected) {

                                            setForm({
                                                ...form,
                                                vehicleId: '',
                                                vehicleNoInput: ''
                                            })

                                            return
                                        }

                                        const vehicleExists = vehicles.find(
                                            x => x.id == selected.value
                                        )

                                        if (vehicleExists) {

                                            setForm({
                                                ...form,
                                                vehicleId: selected.value,
                                                vehicleNoInput: vehicleExists.vehicleNo.toUpperCase()
                                            })

                                        } else {

                                            setForm({
                                                ...form,
                                                vehicleId: '',
                                                vehicleNoInput: selected.label.toUpperCase()
                                            })
                                        }
                                    }}

                                    onInputChange={(inputValue, actionMeta) => {

                                        if (actionMeta.action === 'input-change') {

                                            let value = inputValue
                                                .toUpperCase()
                                                .replace(/[^A-Z0-9]/g, '')
                                                .slice(0, 10)

                                            setForm(prev => ({
                                                ...prev,
                                                vehicleNoInput: value
                                            }))

                                            return value
                                        }

                                        return inputValue
                                    }}

                                    placeholder="Search or Enter Vehicle No..."

                                    isSearchable
                                    isClearable
                                    isDisabled={isLocked && binList.length > 0}

                                    formatCreateLabel={(inputValue) =>
                                        `Use "${inputValue.toUpperCase()}"`
                                    }
                                />
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>Reference No <span className="req">*</span></label>
                                <CFormInput
                                    value={form.referenceNo}
                                    maxLength={16}
                                    disabled={isLocked && binList.length > 0}
                                    onChange={(e) => {
                                        let val = e.target.value
                                        val = val.replace(/[^A-Za-z0-9]/g, '')
                                        setForm({
                                            ...form,
                                            referenceNo: val.toUpperCase()
                                        })
                                    }}

                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            if (
                                                form.customerId &&
                                                (form.vehicleId || form.vehicleNoInput) &&
                                                form.referenceNo
                                            ) {
                                                scanRef.current?.focus()
                                            }
                                        }
                                    }}
                                />
                            </CCol>
                            <CCol xs={12} md={1} className="refresh-btn">
                                <CButton
                                    color="success"
                                    onClick={() => {
                                        setIsLocked(false)
                                        scanRef.current?.focus()
                                    }}
                                >
                                    ↻
                                </CButton>
                            </CCol>
                            <CCol xs={12} md={3}>
                                <label>Bin Condition</label>
                                <CFormSelect
                                    value={form.condition}

                                    onChange={(e) =>
                                        setForm({ ...form, condition: e.target.value })
                                    }

                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            scanRef.current?.focus()
                                        }
                                    }}
                                >
                                    <option value="Good">Good</option>
                                    <option value="Damaged">Damaged</option>
                                </CFormSelect>
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>Remarks</label>
                                <CFormInput
                                    value={form.remarks}

                                    onChange={(e) =>
                                        setForm({ ...form, remarks: e.target.value })
                                    }

                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            scanRef.current?.focus()
                                        }
                                    }}
                                />
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>
                                    Driver Name <span className="req">*</span>
                                </label>

                                <CFormInput
                                    value={form.driverName}

                                    maxLength={30}

                                    onChange={(e) => {

                                        const val = e.target.value
                                            .replace(/[^A-Za-z ]/g, '')

                                        setForm({
                                            ...form,
                                            driverName: val
                                        })
                                    }}

                                    onKeyDown={(e) => {

                                        if (e.key === 'Enter') {

                                            e.preventDefault()

                                            // ✅ MOVE TO DRIVER NO
                                            document.getElementById('receiveDriverNo')?.focus()
                                        }
                                    }}
                                />
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>
                                    Driver No <span className="req">*</span>
                                </label>
                                <CFormInput
                                    id="receiveDriverNo"
                                    value={form.driverNo}


                                    maxLength={10}

                                    onChange={(e) => {

                                        const val = e.target.value
                                            .replace(/\D/g, '')
                                            .slice(0, 10)

                                        setForm({
                                            ...form,
                                            driverNo: val
                                        })
                                    }}

                                    onKeyDown={(e) => {

                                        if (e.key === 'Enter') {

                                            e.preventDefault()

                                            // ✅ MOVE TO SCAN INPUT
                                            scanRef.current?.focus()
                                        }
                                    }}
                                />
                            </CCol>
                        </CRow>

                        {/* SCAN */}
                        <div className="scan-box">
                            <div className="scan-inner">

                                {/* ICON */}
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

                                        <rect x="7" y="7" width="3" height="3" rx="0.5" />
                                        <rect x="14" y="7" width="3" height="3" rx="0.5" />
                                        <rect x="7" y="14" width="3" height="3" rx="0.5" />

                                        <circle cx="15.5" cy="15.5" r="0.8" />
                                        <circle cx="18" cy="18" r="0.8" />
                                        <circle cx="13" cy="18" r="0.8" />
                                    </svg>
                                </span>

                                {/* INPUT */}
                                <input
                                    ref={scanRef}
                                    value={scanValue}
                                    autoFocus
                                    placeholder="Scan or Enter Packages No"

                                    onChange={(e) => {

                                        const val = e.target.value
                                            .replace(/[^A-Za-z0-9]/g, '')
                                            .toUpperCase()

                                        setScanValue(val)

                                        // ✅ AUTO SCAN LIKE SEND SCREEN
                                        if (val.length >= 8 && !scanLock) {

                                            processScan(val)
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="last-scan">
                            Last Scanned Packages <span>{lastScanned || '-'}</span>
                        </div>
                        <div className="form-actions">
                            <CButton color="success" onClick={handleSave}>
                                {isEdit ? "Update" : "Save"}
                            </CButton>
                            <CButton color="secondary" onClick={handleClear}>Clear</CButton>
                        </div>

                    </CCardBody>
                </CCard>
            )}

            {/* GRID */}
            {!showForm && (
                <CCard className="mt-3">
                    <CCardBody>
                        <h6 className="mb-3 text-center" style={{ fontSize: '18px', fontWeight: '600' }}>Receive Details</h6>

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
                            paginationServer
                            highlightOnHover
                            striped
                            responsive
                            paginationTotalRows={totalRows}
                            onChangePage={(page) => {
                                setCurrentPage(page)
                                loadAll(page)
                            }}
                            customStyles={customStyles}
                            persistTableHead
                        />
                    </CCardBody>
                </CCard>
            )}



            {showForm && binList.length > 0 && (
                <CCard className="mt-3">
                    <CCardBody>
                        <h6 className="text-center mb-2" style={{ fontSize: '18px', fontWeight: '600' }}>Scanned Bins</h6>
                        <DataTable
                            columns={[
                                {
                                    name: 'S.No',

                                    selector: (row, index) =>
                                        (scanPage - 1) * scanRowsPerPage + index + 1,

                                    width: '90px'
                                },

                                { name: 'Part No', selector: r => r.partNo },
                                { name: 'Packages No', selector: r => r.binNo },
                                { name: 'Customer', selector: r => r.customerName },
                                { name: 'Reference No', selector: r => r.referenceNo, width: '200px' },
                                { name: 'Vehicle No', selector: r => r.vehicleNo },
                                { name: 'Driver Name', selector: r => r.driverName },
                                { name: 'Driver No', selector: r => r.driverNo },
                                { name: 'Scan Time', selector: r => r.scanDateTime },

                                {
                                    name: 'Action',
                                    cell: (row, index) => (
                                        <>
                                            {partPrivilege.canEdit && (
                                                <FaEdit
                                                    title="Edit"
                                                    className="action-icon edit-icon"
                                                    onClick={() => handleGridEdit(row, index)}
                                                />)}

                                            {partPrivilege.canEdit && (

                                                <FaTrash
                                                    title="Delete"
                                                    className="action-icon delete-icon"
                                                    onClick={() =>
                                                        setBinList(prev =>
                                                            prev.filter((_, i) => i !== index)
                                                        )
                                                    }
                                                />)}
                                        </>
                                    )
                                }
                            ]}

                            data={binList}

                            dense
                            highlightOnHover
                            pagination
                            striped
                            responsive
                            customStyles={customStyles}
                            persistTableHead
                            onChangePage={(page) => setScanPage(page)}
                            onChangeRowsPerPage={(newPerPage, page) => {
                                setScanRowsPerPage(newPerPage)
                                setScanPage(page)
                            }}
                        />
                    </CCardBody>
                </CCard>
            )}

            <CModal
                visible={showTransactionModal}
                size="xl"

                onClose={() => {
                    setShowTransactionModal(false)
                    setTransactionSearch('')
                }}
            >
                <CModalHeader>
                    <CModalTitle>
                        📦 Transaction #{selectedTransaction} Bin Details
                    </CModalTitle>
                </CModalHeader>

                <CModalBody>

                    <div className="d-flex justify-content-end mb-2">
                        <CFormInput
                            placeholder="Search..."
                            style={{ width: '220px' }}
                            value={transactionSearch}
                            onChange={(e) => setTransactionSearch(e.target.value)}
                        />
                    </div>

                    <DataTable
                        columns={[

                            {
                                name: 'S.No',

                                cell: (row, index) =>
                                    (modalPage - 1) * modalRowsPerPage + index + 1,

                                width: '80px'
                            },

                            {
                                name: 'Part No',
                                cell: r => tooltipCell(r.partNo),
                                width: '200px'
                            },

                            {
                                name: 'Packages Type',
                                cell: r => tooltipCell(r.binMaterialType),
                                width: '200px'
                            },

                            {
                                name: 'Packages No',
                                cell: r => tooltipCell(r.binNo),
                                width: '200px'
                            },

                            {
                                name: 'Condition',

                                cell: r => (

                                    <CTooltip content={r.condition}>

                                        <span
                                            style={{
                                                color:
                                                    r.condition === 'Damaged'
                                                        ? 'red'
                                                        : 'green',
                                                fontWeight: '600'
                                            }}
                                        >
                                            {r.condition}
                                        </span>

                                    </CTooltip>
                                ),

                                width: '140px'
                            },

                            {
                                name: 'Remarks',
                                cell: r => tooltipCell(r.remarks),
                                width: '160px'
                            },

                            {
                                name: 'Action',
                                cell: row => (
                                    <div className="d-flex gap-2">

                                        {partPrivilege.canEdit && (
                                            <FaEdit
                                                title="Edit"
                                                className="action-icon edit-icon"
                                                onClick={() => {
                                                    handleEdit(row)
                                                    setShowTransactionModal(false)
                                                }}
                                            />
                                        )}

                                        {partPrivilege.canDelete && (
                                            <FaTrash
                                                title="Delete"
                                                className="action-icon delete-icon"
                                                onClick={() => {
                                                    setDeleteId(row.id)
                                                    setDeleteBinNo(row.binNo)
                                                    setShowDeleteModal(true)
                                                }}
                                            />
                                        )}

                                    </div>
                                )
                            }
                        ]}

                        data={filteredTransactionBins}

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
        </div>
    )
}

export default Receive