import React, { useEffect, useState, useRef } from 'react';
import DataTable from 'react-data-table-component';
import { CRow, CCol, CFormSelect, CFormInput, CButton, CCard, CCardBody, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter } from '@coreui/react';
import API from '../../api';
import { toast } from 'react-toastify';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';
import '../../assets/CSS/send.css';
import Select from 'react-select';
import '../../assets/CSS/user.css';
import usePrivilege from '../hooks/usePrivilege.js'
import totalBinImg from '../../assets/images/Total Bin.png'
import availableImg from '../../assets/images/Available Bin.png';
import damaged from '../../assets/images/Damaged.png';


const Send = () => {
    const [showTransactionModal, setShowTransactionModal] = useState(false)
    const [transactionBins, setTransactionBins] = useState([])
    const [selectedTransaction, setSelectedTransaction] = useState(null)
    const scanRef = React.useRef()
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        customerId: '',
        vehicleId: '',
        driverName: '',
        driverNo: '',
        referenceNo: '',
        binNo: ''
    });
    const [customers, setCustomers] = useState([]);
    const [search, setSearch] = useState('');
    const [vehicles, setVehicles] = useState([]);
    const [data, setData] = useState([]);
    const [binList, setBinList] = useState([]);
    const [isLocked, setIsLocked] = useState(false);
    const [lastScanned, setLastScanned] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [scanValue, setScanValue] = useState('');
    const [scanBuffer, setScanBuffer] = useState('');
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [modalPage, setModalPage] = useState(1)
    const [modalRowsPerPage, setModalRowsPerPage] = useState(10)
    const [scanPage, setScanPage] = useState(1)
    const [scanRowsPerPage, setScanRowsPerPage] = useState(10)
    const [bins, setBins] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [transactionSearch, setTransactionSearch] = useState('')
    const customerRef = useRef();
    const [showReceivePopup, setShowReceivePopup] = useState(false);
    const [selectedBin, setSelectedBin] = useState('');
    const [scanLock, setScanLock] = useState(false);
    const [counts, setCounts] = useState({
        total: 0,
        available: 0,
        damaged: 0,
        customer: 0
    });
    const [deleteBinNo, setDeleteBinNo] = useState('');
    const { privileges } = usePrivilege()
    const partPrivilege = privileges.find(p => p.menuName === 'Send') || {}

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
        loadAll()
    }, [])

    useEffect(() => {
        if (showForm) {
            setTimeout(() => {
                customerRef.current?.focus()
            }, 100)
        }
    }, [showForm])



    const [page, setPage] = useState(1)
    const [totalRows, setTotalRows] = useState(0)
    const loadAll = async (pageNo = 1) => {
        const d = await API.get(`/send?page=${pageNo}&pageSize=10`)

        setData(d.data.data)
        setTotalRows(d.data.totalCount)

        const c = await API.get('/send/customers')
        const v = await API.get('/send/vehicles')
        const cnt = await API.get('/send/counts')

        setCustomers(c.data)
        setVehicles(v.data)
        setCounts(cnt.data)
    }
    const handleVehicle = (id) => {
        const v = vehicles.find(x => x.id == id)

        setForm(prev => ({
            ...prev,
            vehicleId: id,
            // driverName: v?.driverName || '',
            // driverNo: v?.driverNo || ''
        }))
    }
    const [isScanning, setIsScanning] = useState(false)
    const handleScan = (value) => {

        if (isScanning) return
        setIsScanning(true)

        if (value.length < 5) {
            setIsScanning(false)
            return
        }

        if (!form.customerId || !form.vehicleId || !form.referenceNo) {
            toast.dismiss()
            toast.error('Select Customer, Vehicle & Reference first')
            setIsScanning(false)
            return
        }

        if (binList.some(x => x.binNo === value)) {
            toast.dismiss()
            toast.error('Already scanned')
            setIsScanning(false)
            return
        }

        const vehicle = vehicles.find(v => v.id == form.vehicleId)

        const newRow = {
            partNo: res.data.partNo,
            binNo: value,
            customerId: form.customerId,
            vehicleId: form.vehicleId,
            referenceNo: form.referenceNo,
            scanDateTime: new Date().toLocaleString()
        }
        setBinList(prev => [...prev, newRow])
        setLastScanned(value)
        setIsLocked(true)

        setTimeout(() => {
            setIsScanning(false)
            scanRef.current?.focus()
        }, 200)
    }
    const validate = () => {
        if (!form.customerId) return toast.error('Customer is required')
        if (!form.vehicleId) return toast.error('Vehicle is required')
        if (!form.referenceNo) return toast.error('Reference No is required')
        if (!form.binNo || form.binNo.trim() === '') return toast.error('Scan Bin required')

        return true
    }

    const handleGridEdit = (row, index) => {
        // remove row from grid
        setBinList(prev => prev.filter((_, i) => i !== index))

        // put value in scan box (or form)
        setScanValue('');

        // focus scan input
        setTimeout(() => {
            scanRef.current?.focus()
        }, 100)
    }

    const handleSave = async () => {

        if (
            !form.customerId ||
            !form.vehicleId ||
            !form.referenceNo ||
            !form.driverName ||
            !form.driverNo
        ) {
            return toast.error('Fill all required fields')
        }

        // ✅ DRIVER NO MUST BE 10 DIGITS
        if (!/^\d{10}$/.test(form.driverNo)) {
            return toast.error('Invalid Driver No')
        }

        try {
            if (isEdit) {
                await API.put(`/send/${editId}`, form)
                toast.success("Updated Successfully")
            } else {
                if (binList.length === 0) {
                    return toast.error('Scan at least one bin')
                }

                const payload = {
                    bins: binList.map(x => ({
                        binNo: x.binNo,
                        referenceNo: x.referenceNo,
                        customerId: x.customerId,
                        vehicleId: x.vehicleId,
                        condition: "Good",
                        driverName: x.driverName,
                        driverNo: x.driverNo
                    }))
                }
                const res = await API.post('/send/bulk', payload)

                toast.success('Bins Send Successfully')
                const url =
                    `${window.location.origin}${window.location.pathname}#/send-report/${res.data.batchId}`
                window.open(
                    url,
                    'SEND_PRINT',
                    'width=1200,height=1000'
                )
            }

            loadAll()
            setIsEdit(false)
            setEditId(null)
            setBinList([])
            handleClear()

        } catch (err) {
            toast.error(err.response?.data || "Error")
        }
    }

    const handleEdit = async (row) => {
        try {
            const res = await API.get(`/send/${row.id}`)
            setForm({
                customerId: res.data.customerId,
                vehicleId: res.data.vehicleId,
                referenceNo: res.data.referenceNo,
                binNo: res.data.binNo,
                driverName: res.data.driverName || '',
                driverNo: res.data.driverNo || ''
            })
            setEditId(row.id)
            setIsEdit(true)
            setShowTransactionModal(false)
            setShowForm(true)
        } catch (err) {
            toast.error("Failed to load data")
        }
    }


    const openTransaction = async (batchId) => {
        setTransactionSearch('')
        const res = await API.get(
            `/send/transaction-details/${batchId}`
        )
        setTransactionBins(res.data)
        setSelectedTransaction(batchId)
        setShowTransactionModal(true)
    }

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
            ),

        },

        {
            name: 'Packages Count',
            selector: r => r.binCount,
            width: '200px',
            center: true,

        },

        {
            name: 'Reference No',
            selector: r => r.referenceNo,
            width: '200px'

        },

        {
            name: 'Vehicle No',
            selector: r => r.vehicleNo,

        },

        {
            name: 'Driver Name',
            selector: r => r.driverName,
            width: '200px'

        },

        {
            name: 'Driver No',
            selector: r => r.driverNo,

        },

        {
            name: 'Scan Date',
            cell: r => {
                const d = new Date(r.scanDateTime)

                return `${d.getDate().toString().padStart(2, '0')}-` +
                    `${(d.getMonth() + 1).toString().padStart(2, '0')}-` +
                    `${d.getFullYear()} ` +
                    `${d.toLocaleTimeString()}`
            },
            width: '300px'
        },

        {
            name: 'Picklist',
            cell: row => (
                <CButton
                    size="sm"
                    color="dark"
                    onClick={() => {
                        const url =
                            `${window.location.origin}${window.location.pathname}#/send-report/${row.transactionId}`
                        window.open(
                            url,
                            'SEND_PRINT',
                            'width=1200,height=1000'
                        )

                    }}
                >
                    Reprint
                </CButton>
            ),
            center: true,

        },

        // {
        //     name: 'Action',
        //     cell: row => (
        //         <div className="d-flex gap-2">

        //             {partPrivilege.canEdit && (
        //                 <FaEdit
        //                     className="action-icon edit-icon"
        //                     onClick={() => handleEdit(row)}
        //                 />
        //             )}

        //             {partPrivilege.canDelete && (
        //                 <FaTrash
        //                     className="action-icon delete-icon"
        //                     onClick={() => {

        //                         setDeleteId(row.transactionId)

        //                         setShowDeleteModal(true)
        //                     }}
        //                 />
        //             )}

        //         </div>
        //     ),
        //     center: true,
        //     width: '120px'
        // }
    ]

    const filteredData = data.filter(item => {

        return (

            item.transactionId
                ?.toString()
                ?.includes(search)

            ||

            item.referenceNo
                ?.toLowerCase()
                ?.includes(search.toLowerCase())

            ||

            item.vehicleNo
                ?.toLowerCase()
                ?.includes(search.toLowerCase())

            ||

            item.driverName
                ?.toLowerCase()
                ?.includes(search.toLowerCase())

            ||

            item.driverNo
                ?.toString()
                ?.includes(search)
        )
    })

    const confirmDelete = async () => {

        try {
            await API.delete(`/send/${deleteId}`)
            toast.success('Bin Deleted Successfully')
            if (isEdit && deleteId === editId) {
                handleClear()
                setIsEdit(false)
                setEditId(null)
                setShowForm(false)
            }


            await loadAll()
            setShowDeleteModal(false)
            setShowTransactionModal(false)

        }
        catch {
            toast.error('Delete Failed')
        }
        finally {
            setDeleteId(null)
        }
    }
    const handleClear = () => {
        setForm({
            customerId: '',
            vehicleId: '',
            driverName: '',
            driverNo: '',
            referenceNo: ''
        });

        setBinList([]);
        setIsLocked(false);
        setLastScanned('');
        setScanBuffer('');
        setIsEdit(false);   // ✅ ADD THIS
        setEditId(null);
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

        if (
            !form.customerId ||
            !form.vehicleId ||
            !form.referenceNo ||
            !form.driverName ||
            !form.driverNo
        ) {
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
            toast.error('Already scanned')
            setScanValue('')
            setScanLock(false)
            return
        }

        try {

            const res = await API.get(`/send/get-bin/${value}`)

            // ✅ CHECK AGAIN AFTER API
            const alreadyExists = binList.some(x => x.binNo === value)

            if (alreadyExists) {
                toast.error('Already scanned')
                setScanLock(false)
                return
            }

            const vehicle = vehicles.find(v => v.id == form.vehicleId)
            const customer = customers.find(c => c.id == form.customerId)

            const newRow = {
                partNo: res.data.partNo,
                binNo: value,
                customerId: form.customerId,
                customerName: customer?.customerName || '',
                vehicleId: form.vehicleId,
                vehicleNo: vehicle?.vehicleNo || '',
                referenceNo: form.referenceNo,
                driverName: form.driverName,
                driverNo: form.driverNo,
                scanDateTime: new Date().toLocaleString()
            }

            // ✅ SAFE STATE UPDATE
            setBinList(prev => {

                // prevent duplicate inside state update
                if (prev.some(x => x.binNo === value)) {
                    return prev
                }

                return [...prev, newRow]
            })

            setLastScanned(value)
            setIsLocked(true)

        }

        catch (err) {

            const msg = err.response?.data || '';

            if (msg.includes('already sent')) {

                const binNo = value;

                setSelectedBin(binNo);
                setShowReceivePopup(true);

                return;
            }

            toast.error(msg);
        }
        finally {

            setScanValue('')

            setTimeout(() => {
                setScanLock(false)
                scanRef.current?.focus()
            }, 300)
        }
    }
    const filteredTransactionBins = transactionBins.filter(item =>
        item.partNo?.toString().toLowerCase().includes(transactionSearch.toLowerCase()) ||

        item.binMaterialType?.toLowerCase().includes(transactionSearch.toLowerCase()) ||

        item.binNo?.toLowerCase().includes(transactionSearch.toLowerCase())
    )
    const latestBin = lastScanned

    const handleReceiveAndSend = async () => {
        try {

            await API.post(
                `/receive/auto-receive/${selectedBin}`
            );

            setShowReceivePopup(false);

            // ✅ automatically add to grid
            processScan(selectedBin);

        } catch (err) {

            toast.error(
                err.response?.data || 'Receive failed'
            );
        }
    };
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
                visible={showReceivePopup}
                onClose={() => setShowReceivePopup(false)}
                alignment="center"
                backdrop="static"
            >
                <CModalHeader className="border-0 pb-0">
                    <CModalTitle
                        className="w-100 text-center fw-bold text-danger"
                    >
                        ⚠ Package Already Sent
                    </CModalTitle>
                </CModalHeader>

                <CModalBody className="text-center pt-2">
                    <div
                        style={{
                            fontSize: "18px",
                            marginBottom: "15px"
                        }}
                    >
                        Package
                        <span
                            style={{
                                color: "#dc3545",
                                fontWeight: "bold",
                                marginLeft: "6px"
                            }}
                        >
                            {selectedBin}
                        </span>
                    </div>

                    <div
                        style={{
                            fontSize: "16px",
                            color: "#555"
                        }}
                    >
                        This package is already in <b>Send</b> status.
                    </div>

                    <div
                        style={{
                            marginTop: "15px",
                            fontSize: "16px"
                        }}
                    >
                        Did you receive this package from customer?
                    </div>
                </CModalBody>

                <CModalFooter
                    className="border-0 justify-content-center"
                >
                    <CButton
                        color="secondary"
                        size="lg"
                        style={{
                            minWidth: "120px",
                            fontWeight: "600"
                        }}
                        onClick={() => setShowReceivePopup(false)}
                    >
                        No
                    </CButton>

                    <CButton
                        color="success"
                        size="lg"
                        style={{
                            minWidth: "120px",
                            fontWeight: "600"
                        }}
                        onClick={handleReceiveAndSend}
                    >
                        Yes
                    </CButton>
                </CModalFooter>
            </CModal>



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
                            style={{ width: '200px' }}
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
                                selector: r => r.partNo
                            },

                            {
                                name: 'Packages Type',
                                selector: r => r.binMaterialType
                            },

                            {
                                name: 'Packages No',
                                selector: r => r.binNo
                            },

                            {
                                name: 'Action',
                                cell: row => (
                                    <div className="d-flex gap-2">
                                        {partPrivilege.canEdit && (
                                            <FaEdit
                                                title="Edit"
                                                className="action-icon edit-icon"
                                                onClick={() => handleEdit(row)}
                                            />)}
                                        {partPrivilege.canDelete && (
                                            <FaTrash
                                                title="Delete"
                                                className="action-icon delete-icon"
                                                onClick={() => {
                                                    setDeleteId(row.id)
                                                    setDeleteBinNo(row.binNo)
                                                    setShowDeleteModal(true)
                                                }}
                                            />)}
                                    </div>
                                )
                            }
                        ]}

                        data={filteredTransactionBins}

                        pagination
                        striped
                        responsive
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
            {/* ===== TOP CARDS ===== */}
            {!showForm && (
                <CCard className="mb-3 summary-wrapper">
                    <CCardBody>

                        <div className="wsummary-container">
                            {/* TOTAL */}
                            <div className="summary-card total-card"
                                onClick={() => setSelectedFilter('all')}>
                                <div className="content">
                                    <div className="title">Total Packages</div>
                                    <div className="value">{counts.total || 0}</div>
                                </div>
                                <div className="summary-icon">
                                    <img src={totalBinImg} alt="Total Bin" />
                                </div>
                            </div>

                            {/* AVAILABLE */}
                            <div className="summary-card available-card"
                                onClick={() => setSelectedFilter('available')}>
                                <div className="content">
                                    <div className="title">Available Packages</div>
                                    <div className="value">{counts.available || 0}</div>
                                </div>
                                <div className="summary-icon">
                                    <img src={availableImg} alt="Total Bin" />
                                </div>
                            </div>

                            {/* DAMAGED */}
                            <div className="summary-card damaged-card"
                                onClick={() => setSelectedFilter('damaged')}>
                                <div className="content">
                                    <div className="title">Damaged Packages</div>
                                    <div className="value">{counts.damaged || 0}</div>
                                </div>
                                <div className="summary-icon">
                                    <img src={damaged} alt="Total Bin" />
                                </div>
                            </div>

                            {/* CUSTOMER */}
                            <div className="summary-card atcustomer-card"
                                onClick={() => setSelectedFilter('customer')}>
                                <div className="content">
                                    <div className="title">Packages at Customer</div>
                                    <div className="value">{counts.send || 0}</div>
                                </div>
                                <div className="summary-icon">
                                    <img src={totalBinImg} alt="Total Bin" />
                                </div>
                            </div>

                            {/* ADD BUTTON */}
                            <div className="add-btn">
                                <CButton shape="rounded-circle" color="dark" onClick={() => {
                                    handleClear()        // ✅ CLEAR OLD DATA
                                    setIsEdit(false)
                                    setEditId(null)
                                    setShowForm(true)
                                }}>
                                    <FaPlus />
                                </CButton>
                                <div className="add-text">Add</div>
                            </div>

                        </div>

                    </CCardBody>
                </CCard>
            )}
            {showForm && (
                <CCard className="mb-3 shadow-sm">
                    <CCardBody>

                        {/* HEADER */}
                        <div className="form-header">
                            <h5>{isEdit ? "Update Packages" : "Send Packages"}</h5>
                            <CButton
                                color="light"
                                onClick={() => {

                                    setShowForm(false)

                                    setTimeout(() => {
                                        customerRef.current?.focus()
                                        scanRef.current?.focus()
                                    }, 200)
                                }}
                            >
                                ← Back
                            </CButton>
                        </div>

                        {/* FORM GRID */}
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
                                        .find(opt => opt.value === form.customerId) || null
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
                                <Select
                                    options={vehicles.map(v => ({
                                        value: v.id,
                                        label: v.vehicleNo
                                    }))}

                                    value={
                                        vehicles
                                            .map(v => ({ value: v.id, label: v.vehicleNo }))
                                            .find(opt => opt.value == form.vehicleId) || null
                                    }

                                    onChange={(selected) => {
                                        if (!selected) {
                                            setForm({
                                                ...form,
                                                vehicleId: '',
                                                // driverName: '',
                                                // driverNo: ''
                                            })
                                            return
                                        }

                                        handleVehicle(selected.value)
                                    }}

                                    placeholder="Search Vehicle No..."
                                    isSearchable
                                    isClearable
                                    isDisabled={isLocked && binList.length > 0}
                                />
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>Reference No <span className="req">*</span></label>
                                <CFormInput
                                    value={form.referenceNo}
                                    disabled={isLocked && binList.length > 0}
                                    maxLength={16}
                                    onChange={(e) => {
                                        let val = e.target.value

                                        // allow only A-Z, 0-9
                                        val = val.replace(/[^A-Za-z0-9]/g, '')

                                        setForm({ ...form, referenceNo: val.toUpperCase() })
                                    }}

                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()

                                            if (
                                                form.customerId &&
                                                form.vehicleId &&
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
                                        setIsLocked(false)   // ✅ ONLY unlock fields
                                        scanRef.current?.focus()
                                    }}
                                >
                                    ↻
                                </CButton>
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>Driver Name <span className="req">*</span></label>

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
                                            document.getElementById('driverNoInput')?.focus()
                                        }
                                    }}
                                />
                            </CCol>

                            <CCol xs={12} md={3}>
                                <label>Driver No <span className="req">*</span></label>
                                <CFormInput
                                    id="driverNoInput"

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

                        {/* LAST SCANNED */}
                        <div className="last-scan">
                            Last Scanned Packages <span>{latestBin || '-'}</span>
                        </div>

                        {/* SCAN BOX */}
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
                                        {/* corners */}
                                        <path d="M6 3H5a2 2 0 0 0-2 2v1" />
                                        <path d="M18 3h1a2 2 0 0 1 2 2v1" />
                                        <path d="M21 18v1a2 2 0 0 1-2 2h-1" />
                                        <path d="M3 18v1a2 2 0 0 0 2 2h1" />

                                        {/* qr blocks */}
                                        <rect x="7" y="7" width="3" height="3" rx="0.5" />
                                        <rect x="14" y="7" width="3" height="3" rx="0.5" />
                                        <rect x="7" y="14" width="3" height="3" rx="0.5" />

                                        {/* dots */}
                                        <circle cx="15.5" cy="15.5" r="0.8" />
                                        <circle cx="18" cy="18" r="0.8" />
                                        <circle cx="13" cy="18" r="0.8" />
                                    </svg>
                                </span>
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
                                        if (val.length >= 8) {
                                            processScan(val)
                                        }
                                    }}
                                />
                            </div>
                        </div>
                        {/* BUTTONS */}
                        <div className="form-actions">
                            <CButton color="success" onClick={handleSave}>
                                {isEdit ? "Update" : "Save"}
                            </CButton>
                            <CButton color="secondary" onClick={handleClear}>Clear</CButton>
                        </div>

                    </CCardBody>
                </CCard>
            )}
            {!showForm && (
                <CCard>
                    <CCardBody>

                        <h6 className="mb-3 text-center" style={{ fontSize: '18px', fontWeight: '600' }}>Send Details</h6>

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
                            paginationTotalRows={totalRows}
                            onChangePage={page => loadAll(page)}
                            highlightOnHover
                            striped
                            responsive
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

                                            {partPrivilege.canDelete && (

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
        </div>
    )
}

export default Send