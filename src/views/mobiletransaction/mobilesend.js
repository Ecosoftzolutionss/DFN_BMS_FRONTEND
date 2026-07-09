import React, { useEffect, useState, useRef } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import DataTable from 'react-data-table-component';
import { CButton, CCard, CCardBody, CFormInput, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, } from '@coreui/react';
import '../../assets/CSS/mobilesend.css';
import '../../assets/CSS/user.css';
import totalIcon from '../../assets/images/Total Bin.png';
import availableIcon from '../../assets/images/Available Bin.png';
import damagedIcon from '../../assets/images/Damaged.png';
import customerIcon from '../../assets/images/Bin.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrcode } from '@fortawesome/free-solid-svg-icons';
import { faRotateRight } from '@fortawesome/free-solid-svg-icons';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { FaTrash, FaEdit } from 'react-icons/fa';
import usePrivilege from '../hooks/usePrivilege.js'

const MobileSend = () => {
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
    const scanRef = useRef();
    const isProcessingRef = useRef(false);
    const customerRef = useRef();
    const [step, setStep] = useState(1); // 🔥 STEP CONTROL
    const [activeTab, setActiveTab] = useState('');
    const [form, setForm] = useState({
        customerId: '',
        vehicleId: '',
        driverName: '',
        vehicleNoInput: '',
        driverNo: '',
        referenceNo: ''
    });

    const [showClearModal, setShowClearModal] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [sendList, setSendList] = useState([]);
    const [deleteIndex, setDeleteIndex] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [receiveList, setReceiveList] = useState([]);
    const [lastScannedSend, setLastScannedSend] = useState('');
    const [lastScannedReceive, setLastScannedReceive] = useState('');
    const [isLocked, setIsLocked] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [checkingPermission, setCheckingPermission] = useState(true);
    const [showReceivePopup, setShowReceivePopup] = useState(false);
    const [autoReceiveBin, setAutoReceiveBin] = useState('');
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        total: 0,
        available: 0,
        damaged: 0,
        atCustomer: 0
    });
    const menuRef = useRef();
    const permissionChecked = useRef(false)
    const user = JSON.parse(sessionStorage.getItem('user') || 'null');
    const isMobilityWithoutCheck = user?.mobilityWithoutCheck === true
    const { privileges } = usePrivilege()

    const sendPrivilege =
        privileges.find(p => p.menuName === 'Send') || {
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false
        }

    const receivePrivilege =
        privileges.find(p => p.menuName === 'Receive') || {
            canView: false,
            canAdd: false,
            canEdit: false,
            canDelete: false
        }

    useEffect(() => {

        if (step !== 2) return;

        const moveToScanBox = () => {
            const active = document.activeElement;
            if (
                active?.tagName === "INPUT" &&
                active !== scanRef.current
            ) {
                return;
            }

            // ✅ AUTO FOCUS SCAN BOX
            setTimeout(() => {
                scanRef.current?.focus();
            }, 100);
        };

        document.addEventListener("click", moveToScanBox);
        return () => {
            document.removeEventListener(
                "click",
                moveToScanBox
            );
        };

    }, [step]);
    const selectedBin =
        activeTab === 'send'
            ? sendList[deleteIndex]
            : receiveList[deleteIndex];
    useEffect(() => {
        loadDropdowns();
    }, [activeTab]);

    useEffect(() => {
        loadSummary();
    }, []);


    const loadDropdowns = async () => {
        if (activeTab === 'send') {
            // ✅ ALL DATA
            const c = await API.get('/send/customers');
            const v = await API.get('/send/vehicles');

            setCustomers(c.data);
            setVehicles(v.data);
        } else {
            // ✅ ONLY SEND DATA
            const c = await API.get('/receive/customers-with-send');
            const v = await API.get('/receive/vehicles-with-send');

            setCustomers(c.data);
            setVehicles(v.data);
        }
    };
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false); // 🔥 close menu
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        setTimeout(() => {
            customerRef.current?.focus();
        }, 300);
    }, [activeTab, step]);

    const loadSummary = async () => {
        try {
            const res = await API.get('/send/counts');
            setSummary({
                total: res.data.total,
                available: res.data.available,
                damaged: res.data.damaged,
                atCustomer: res.data.send
            });
        } catch {
            console.log("Summary load failed");
        }
    };

    const handleLogout = () => {
        sessionStorage.removeItem('user');
        window.dispatchEvent(new Event('storage'));
        navigate('/login', { replace: true });
    }
    useEffect(() => {

        if (!privileges?.length) return;

        if (permissionChecked.current) return;

        permissionChecked.current = true;

        const hasSendAccess = sendPrivilege.canView;
        const hasReceiveAccess = receivePrivilege.canView;

        if (!hasSendAccess && !hasReceiveAccess) {

            toast.dismiss();

            toast.error(
                'No Permission For Transaction Screen'
            );

            setTimeout(() => {

                sessionStorage.removeItem('user');

                window.dispatchEvent(
                    new Event('storage')
                );

                navigate('/login', {
                    replace: true
                });

            }, 1000);

            return;
        }

        if (hasSendAccess) {

            setActiveTab('send');

        } else if (hasReceiveAccess) {

            setActiveTab('receive');
        }

        setCheckingPermission(false);

    }, [privileges]);
    // const handleVehicle = (id) => {
    //     const v = vehicles.find(x => x.id == id);

    //     setForm(prev => ({
    //         ...prev,
    //         vehicleId: id,
    //         driverName: v?.driverName || '',
    //         driverNo: v?.driverNo || ''
    //     }));
    // };

    const handleVehicle = (id) => {

        setForm(prev => ({
            ...prev,
            vehicleId: id
        }));
    };

    // ✅ START SCAN
    const startScan = () => {
        const vehicleValidation =
            activeTab === 'receive'
                ? (!form.vehicleId && !form.vehicleNoInput)
                : !form.vehicleId;

        if (
            !form.customerId ||
            vehicleValidation ||
            !form.referenceNo ||
            !form.driverName ||
            !form.driverNo
        ) {
            return toast.error("Fill all fields first");
        }

        if (!/^\d{10}$/.test(form.driverNo)) {
            return toast.error("Driver No must be 10 digits");
        }
        setStep(2);
        setTimeout(() => scanRef.current?.focus(), 200);
    };

    // ✅ SCAN
    const processScan = async (value) => {

        // ✅ prevent double scan
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;

        try {

            // ✅ CLEAN VALUE
            value = String(value || '')
                .replace(/\$/g, '')
                .replace(/Shift/g, '')
                .replace(/[^a-zA-Z0-9]/g, '')
                .trim()
                .toUpperCase();

            // ✅ VALIDATION
            if (!value || value.length < 4) {
                toast.error("Invalid Packages Barcode");
                return;
            }

            const vehicleValidation =
                activeTab === 'receive'
                    ? (!form.vehicleId && !form.vehicleNoInput)
                    : !form.vehicleId;

            // ✅ REQUIRED FIELDS
            if (
                !form.customerId ||
                vehicleValidation ||
                !form.referenceNo ||
                !form.driverName ||
                !form.driverNo
            ) {

                toast.error("Please fill required fields");

                return;
            }


            if (!/^\d{10}$/.test(form.driverNo)) {

                toast.error('Driver No must be 10 digits')

                setScanValue('')
                setScanLock(false)

                return
            }

            // ✅ CURRENT LIST
            const currentList =
                activeTab === 'send'
                    ? sendList
                    : receiveList;

            // ✅ DUPLICATE CHECK
            const alreadyExists = currentList.some(
                x => x.binNo === value
            );

            if (alreadyExists) {

                toast.error("Already scanned");

                return;
            }

            // ✅ API URL
            const apiUrl =
                activeTab === 'send'
                    ? `/send/get-bin/${value}`
                    : `/receive/get-bin/${value}/${form.customerId}`;
            const res = await API.get(apiUrl);

            if (!res.data) {
                toast.error("Invalid Packages");
                return;
            }

            // ✅ NEW ROW
            const newItem = {
                partNo: res.data.partNo,
                binNo: value,
                customerId: form.customerId,
                vehicleId: form.vehicleId,
                referenceNo: form.referenceNo,
                driverName: form.driverName,
                driverNo: form.driverNo,
                scanDateTime: new Date().toLocaleString(),
                condition: 'Good',
                remarks: ''
            };

            // ✅ ADD GRID
            if (activeTab === 'send') {
                setSendList(prev => [...prev, newItem]);
                setLastScannedSend(value);

            } else {
                setReceiveList(prev => [...prev, newItem]);
                setLastScannedReceive(value);
            }

            // ✅ LOCK HEADER
            setIsLocked(true);

        } catch (err) {

            const msg = err?.response?.data || '';

            if (msg.includes('already sent')) {

                setAutoReceiveBin(value);
                setShowReceivePopup(true);
                return;
            }

            toast.error(msg || "Invalid Packages or API Error");
        } finally {

            // ✅ unlock scan
            isProcessingRef.current = false;
            if (scanRef.current) {
                scanRef.current.value = '';
                scanRef.current.focus();
            }
        }
    };

    const handleClearClick = () => {
        setShowClearModal(true);
    };

    const confirmClear = () => {
        setForm({
            customerId: '',
            vehicleId: '',
            driverName: '',
            driverNo: '',
            referenceNo: ''
        });

        setSendList([]);
        setReceiveList([]);
        setLastScannedSend('');
        setLastScannedReceive('');
        setIsLocked(false);

        toast.success("Transaction Cleared Successfully");

        setShowClearModal(false);
    };

    const handleEdit = (index) => {
        setIsLocked(false);

        if (activeTab === 'send') {
            const selected = sendList[index];
            setSendList(prev => prev.filter((_, i) => i !== index));
            scanRef.current?.focus();
            setLastScannedSend(selected.binNo);

        } else {
            const selected = receiveList[index];

            setReceiveList(prev => prev.filter((_, i) => i !== index));

            scanRef.current?.focus();
            setLastScannedReceive(selected.binNo);
        }

        // focus again
        setTimeout(() => scanRef.current?.focus(), 200);
    };

    const confirmDelete = () => {
        if (
            activeTab === 'send' &&
            !sendPrivilege.canDelete
        ) {

            return toast.error('No Delete Permission')
        }

        if (
            activeTab === 'receive' &&
            !receivePrivilege.canDelete
        ) {

            return toast.error('No Delete Permission')
        }
        if (activeTab === 'send') {
            setSendList(prev => prev.filter((_, i) => i !== deleteIndex));
        } else {
            setReceiveList(prev => prev.filter((_, i) => i !== deleteIndex));
        }

        toast.success("Deleted Successfully");

        setShowDeleteModal(false);
        setDeleteIndex(null);
    };

    const handleSave = async () => {

        const vehicleValidation = activeTab === 'receive'
            ? (!form.vehicleId && !form.vehicleNoInput)
            : !form.vehicleId;

        const list = activeTab === 'send' ? sendList : receiveList;
        if (!form.customerId || vehicleValidation || !form.referenceNo || !form.driverName || !form.driverNo) {
            return toast.error("Please fill all required fields");
        }

        if (!/^\d{10}$/.test(form.driverNo)) {
            return toast.error('Invalid Driver No')
        }

        if (list.length === 0) {
            return toast.error("Scan bins");
        }
        try {

            if (activeTab === 'send') {
                const payload = {
                    bins: sendList.map(x => ({
                        binNo: x.binNo,
                        referenceNo: x.referenceNo,
                        customerId: x.customerId,
                        vehicleId: x.vehicleId,
                        driverName: x.driverName,
                        driverNo: x.driverNo,
                        condition: "Good",
                        remarks: ""
                    }))
                };

                const res = await API.post('/send/bulk', payload)
                toast.success("Bin Send Successfully");
                const url = `${window.location.origin}${window.location.pathname}#/send-report/${res.data.batchId}`;

                const reportWindow = window.open(
                    url,
                    'SEND_PRINT',
                    'width=1200,height=1000'
                );



            }

            else {

                const payload = {
                    bins: receiveList.map(x => ({
                        binNo: x.binNo,
                        referenceNo: x.referenceNo,
                        customerId: x.customerId,
                        vehicleId: x.vehicleId || 0,
                        vehicleNoInput:
                            form.vehicleNoInput || "",
                        driverName: x.driverName,
                        driverNo: x.driverNo,
                        condition: x.condition || "Good",
                        remarks: x.remarks || ""
                    }))
                };

                await API.post('/receive/bulk', payload);
                toast.success("Bin Receive Successfully");
            }

            resetAll();
            await loadSummary();

        } catch (err) {
            console.error(err);
            toast.error(err?.response?.data || "Save failed");
        }
    };


    const resetAll = () => {
        setForm({
            customerId: '',
            vehicleId: '',
            driverName: '',
            driverNo: '',
            referenceNo: ''
        });

        setSendList([]);
        setReceiveList([]);
        setLastScannedSend('');
        setLastScannedReceive('');
        setIsLocked(false);
    };

    const handleCondition = (id, isDamaged) => {
        setReceiveList(prev =>
            prev.map(x =>
                x.id === id
                    ? { ...x, condition: isDamaged ? 'Damaged' : 'Good' }
                    : x
            )
        );
    };

    if (checkingPermission) {
        return (
            <div className="text-center mt-5">
                Checking Permission...
            </div>
        );
    }

    const handleReceiveAndSend = async () => {

        try {

            await API.post(
                `/receive/auto-receive/${autoReceiveBin}`
            );

            setShowReceivePopup(false);

            processScan(autoReceiveBin);

        } catch (err) {

            toast.error(
                err?.response?.data || 'Receive failed'
            );
        }
    };

    return (

        <div className="mobile-container">

            <div className="mobile-header">
                <div className="header-left">
                    {activeTab === 'send' ? 'Send' : 'Receive'}
                </div>

                <div className="header-right">
                    <span className="header-time">
                        {new Date().toLocaleString()}
                    </span>

                    <div
                        className="muser-icon"
                        onClick={() => setShowMenu(!showMenu)}
                    >
                        <FontAwesomeIcon icon={faUser} />
                    </div>
                </div>
            </div>

            {showMenu && (
                <>
                    <div className="overlay" onClick={() => setShowMenu(false)}></div>

                    <div className="user-menu">
                        <div className="menu-item" onClick={handleLogout}>
                            <FontAwesomeIcon icon={faRotateRight} />
                            Logout
                        </div>
                    </div>
                </>
            )}

            {/* ================= STEP 1 ================= */}
            {step === 1 && (
                <CCard>
                    <CCardBody>
                        {/* SUMMARY */}
                        <div className="summary-cards">

                            <div className="card">
                                <div className="card-content">
                                    <div>
                                        <span>Total Packages</span>
                                        <h5>{summary.total}</h5>
                                    </div>
                                    <img src={customerIcon} className="card-icon" alt="" />
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-content">
                                    <div>
                                        <span>Available Packages</span>
                                        <h5>{summary.available}</h5>
                                    </div>
                                    <img src={availableIcon} className="card-icon" alt="" />
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-content">
                                    <div>
                                        <span>Damaged Packages</span>
                                        <h5>{summary.damaged}</h5>
                                    </div>
                                    <img src={damagedIcon} className="card-icon" alt="" />
                                </div>
                            </div>

                            <div className="card">
                                <div className="card-content">
                                    <div>
                                        <span>Packages at Customer</span>
                                        <h5>{summary.atCustomer}</h5>
                                    </div>
                                    <img src={customerIcon} className="card-icon" alt="" />
                                </div>
                            </div>

                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label>
                                    Customer <span className="required">*</span>
                                </label>
                                <Select
                                    ref={customerRef}
                                    placeholder="Select"
                                    isDisabled={
                                        isLocked &&
                                        (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                    }
                                    isClearable
                                    value={customers
                                        .map(c => ({ value: c.id, label: c.customerName }))
                                        .find(c => c.value === form.customerId) || null}
                                    options={customers.map(c => ({
                                        value: c.id,
                                        label: c.customerName
                                    }))}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            customerId: e ? e.value : ''
                                        })
                                    }
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Vehicle No <span className="required">*</span>
                                </label>
                                <Select
                                    isDisabled={
                                        isLocked &&
                                        (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                    }
                                    placeholder="Select"
                                    isClearable
                                    value={vehicles
                                        .map(v => ({ value: v.id, label: v.vehicleNo }))
                                        .find(v => v.value === form.vehicleId) || null}
                                    options={vehicles.map(v => ({
                                        value: v.id,
                                        label: v.vehicleNo
                                    }))}
                                    onChange={(e) => {
                                        if (!e) {
                                            setForm({
                                                ...form,
                                                vehicleId: '',
                                                driverName: '',
                                                driverNo: ''
                                            });
                                        } else {
                                            handleVehicle(e.value);
                                        }
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Ref No <span className="required">*</span>
                                </label>

                                <CFormInput
                                    maxLength={16}   // ✅ limit to 16 characters

                                    disabled={
                                        isLocked &&
                                        (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                    }

                                    value={form.referenceNo}

                                    onChange={(e) => {
                                        let val = e.target.value;

                                        // ✅ allow ONLY A-Z + 0-9
                                        val = val.replace(/[^A-Za-z0-9]/g, '');

                                        // 🔥 optional: force uppercase
                                        val = val.toUpperCase();

                                        setForm({ ...form, referenceNo: val });
                                    }}

                                    onKeyUp={(e) => {

                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const value = e.target.value
                                                .replace(/[^A-Za-z0-9]/g, '')
                                                .trim()
                                                .toUpperCase()
                                            if (
                                                value &&
                                                !isProcessingRef.current
                                            ) {

                                                processScan(value)
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Driver Name <span className="required">*</span>
                                </label>
                                {/* <CFormInput value={form.driverName} disabled /> */}
                                <CFormInput
                                    value={form.driverName}
                                    maxLength={30}
                                    disabled={
                                        isLocked &&
                                        (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .replace(/[^A-Za-z ]/g, '')
                                        setForm({
                                            ...form,
                                            driverName: val
                                        })
                                    }}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    Driver No <span className="required">*</span>
                                </label>
                                <CFormInput
                                    value={form.driverNo}
                                    disabled={
                                        isLocked &&
                                        (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                    }
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
                                />
                            </div>
                        </div>

                        {(
                            activeTab === 'send'
                                ? sendPrivilege.canView
                                : receivePrivilege.canView
                        ) && (

                                <CButton
                                    color="success"
                                    className="mt-2"
                                    onClick={startScan}
                                >
                                    <FontAwesomeIcon icon={faQrcode} style={{ marginRight: '8px' }} />
                                    Start Scan
                                </CButton>
                            )}
                    </CCardBody>
                </CCard>
            )}
            {/* ================= STEP 2 ================= */}
            {step === 2 && (
                <>
                    <CCard>
                        <CCardBody>
                            <div className="d-flex justify-content-end align-items-center mb-2">

                                <CButton
                                    color="light"
                                    size="sm"
                                    onClick={() => {
                                        setStep(1);
                                        setActiveTab('send');
                                        resetAll();
                                    }}
                                >
                                    ← Back
                                </CButton>

                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>
                                        Customer <span className="required">*</span>
                                    </label>
                                    <Select

                                        ref={customerRef}
                                        isDisabled={
                                            isLocked &&
                                            (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                        }
                                        value={
                                            customers
                                                .map(c => ({ value: c.id, label: c.customerName }))
                                                .find(c => c.value === form.customerId) || null
                                        }
                                        options={customers.map(c => ({
                                            value: c.id,
                                            label: c.customerName
                                        }))}

                                        isClearable
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                customerId: e ? e.value : ''
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Vehicle No <span className="required">*</span>
                                    </label>
                                    {
                                        activeTab === 'receive' ? (

                                            <CreatableSelect
                                                isDisabled={
                                                    isLocked &&
                                                    receiveList.length > 0
                                                }

                                                placeholder="Search or Enter Vehicle No..."

                                                isClearable
                                                isSearchable

                                                options={vehicles.map(v => ({
                                                    value: v.id,
                                                    label: v.vehicleNo
                                                }))}

                                                value={
                                                    form.vehicleId
                                                        ? vehicles
                                                            .map(v => ({
                                                                value: v.id,
                                                                label: v.vehicleNo
                                                            }))
                                                            .find(v => v.value == form.vehicleId)
                                                        : null
                                                }

                                                onChange={(selected) => {
                                                    if (!selected) {

                                                        setForm({
                                                            ...form,
                                                            vehicleId: '',
                                                            vehicleNoInput: '',
                                                            driverName: '',
                                                            driverNo: ''
                                                        });

                                                        return;

                                                    }

                                                    const existingVehicle = vehicles.find(
                                                        x => x.id == selected.value
                                                    );

                                                    // ✅ EXISTING VEHICLE
                                                    if (existingVehicle) {

                                                        setForm({
                                                            ...form,
                                                            vehicleId: existingVehicle.id,
                                                            vehicleNoInput:
                                                                existingVehicle.vehicleNo.toUpperCase()
                                                        });

                                                    } else {

                                                        // ✅ MANUAL VEHICLE
                                                        let vehicleNo = selected.label
                                                            .toUpperCase()
                                                            .replace(/[^A-Z0-9]/g, '')
                                                            .slice(0, 10)

                                                        setForm({
                                                            ...form,
                                                            vehicleId: '',
                                                            vehicleNoInput: vehicleNo
                                                        });
                                                    }
                                                }}

                                                onInputChange={(inputValue, actionMeta) => {

                                                    if (actionMeta.action === 'input-change') {

                                                        const value = inputValue
                                                            .toUpperCase()
                                                            .replace(/[^A-Z0-9]/g, '')
                                                            .slice(0, 10)

                                                        setForm(prev => ({
                                                            ...prev,
                                                            vehicleNoInput: value
                                                        }))

                                                        return value
                                                    }

                                                    return form.vehicleNoInput
                                                }}

                                                formatCreateLabel={(inputValue) =>
                                                    `Use "${inputValue.toUpperCase()}"`
                                                }
                                            />
                                        ) : (

                                            <Select
                                                isDisabled={
                                                    isLocked &&
                                                    sendList.length > 0
                                                }
                                                placeholder="Select Vehicle"
                                                isClearable
                                                value={
                                                    vehicles
                                                        .map(v => ({
                                                            value: v.id,
                                                            label: v.vehicleNo
                                                        }))
                                                        .find(v => v.value === form.vehicleId) || null
                                                }

                                                options={vehicles.map(v => ({
                                                    value: v.id,
                                                    label: v.vehicleNo
                                                }))}

                                                onChange={(e) => {

                                                    if (!e) {

                                                        setForm({
                                                            ...form,
                                                            vehicleId: '',
                                                            driverName: '',
                                                            driverNo: ''
                                                        });

                                                    } else {

                                                        handleVehicle(e.value);
                                                    }
                                                }}
                                            />
                                        )
                                    }
                                </div>

                                <div className="form-group">
                                    <label>
                                        Ref No <span className="required">*</span>
                                    </label>

                                    <CFormInput
                                        maxLength={16}
                                        disabled={
                                            isLocked &&
                                            (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                        }

                                        value={form.referenceNo}

                                        onChange={(e) => {
                                            let val = e.target.value;
                                            val = val.replace(/[^A-Za-z0-9]/g, '');
                                            val = val.toUpperCase();
                                            setForm({ ...form, referenceNo: val });
                                        }}

                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();

                                                if (
                                                    form.customerId &&
                                                    form.vehicleId &&
                                                    form.referenceNo
                                                ) {
                                                    startScan();
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Driver Name <span className="required">*</span>
                                    </label>

                                    <CFormInput
                                        value={form.driverName}

                                        disabled={
                                            isLocked &&
                                            (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                        }
                                        maxLength={30}
                                        placeholder="Enter Driver Name"
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

                                                e.preventDefault();

                                                // ✅ MOVE DIRECTLY TO SCAN BOX
                                                setTimeout(() => {

                                                    scanRef.current?.focus();

                                                }, 100);
                                            }
                                        }}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>
                                        Driver No <span className="required">*</span>
                                    </label>
                                    {/* <CFormInput value={form.driverNo} disabled /> */}

                                    <CFormInput
                                        value={form.driverNo}

                                        disabled={
                                            isLocked &&
                                            (activeTab === 'send' ? sendList.length > 0 : receiveList.length > 0)
                                        }
                                        maxLength={10}
                                        placeholder="Enter Driver No"
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
                                                e.preventDefault();
                                                if (
                                                    form.customerId &&
                                                    form.vehicleId &&
                                                    form.referenceNo
                                                ) {
                                                    startScan();
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <CButton
                                    color="success"
                                    className="mt-2 px-4"
                                    onClick={() => setIsLocked(false)}
                                >
                                    <FontAwesomeIcon
                                        icon={faRotateRight}
                                        style={{ marginRight: '8px' }}
                                    />
                                    Reference No
                                </CButton>
                            </div>

                        </CCardBody>
                    </CCard>
                    <div className="tabs">
                        {sendPrivilege.canView && (
                            <button
                                className={activeTab === 'send' ? 'active' : ''}
                                onClick={() => {
                                    setActiveTab('send');
                                }}
                            >
                                Send
                            </button>
                        )}

                        {receivePrivilege.canView && (
                            <button
                                className={activeTab === 'receive' ? 'active' : ''}
                                onClick={() => {
                                    setActiveTab('receive');
                                }}
                            >
                                Receive
                            </button>
                        )}
                    </div>

                    {/* SCAN BOX */}
                    <div className="scan-box">
                        <div className="scan-inner">
                            <FontAwesomeIcon icon={faQrcode} size="2x" />
                            <input
                                ref={scanRef}
                                disabled={
                                    activeTab === 'send'
                                        ? !sendPrivilege.canView
                                        : !receivePrivilege.canView
                                }
                                type="text"
                                placeholder="Scan Packages Barcode"
                                autoFocus
                                autoComplete="off"
                                spellCheck={false}
                                onFocus={(e) => {
                                    e.target.select();
                                }}
                                onChange={(e) => {
                                    let value = e.target.value;
                                    value = value
                                        .replace(/\$/g, '')
                                        .replace(/Shift/g, '')
                                        .replace(/[^A-Za-z0-9]/g, '')
                                        .trim()
                                        .toUpperCase();
                                    e.target.value = value;

                                    // ✅ BARCODE COMPLETE
                                    if (value.length >= 8) {

                                        const finalValue = value.slice(-8);

                                        // ✅ CLEAR INPUT
                                        e.target.value = '';

                                        // ✅ PROCESS
                                        processScan(finalValue);
                                    }
                                }}

                                onKeyDown={(e) => {

                                    if (e.key === 'Enter') {

                                        e.preventDefault();

                                        let value = e.target.value
                                            .replace(/\$/g, '')
                                            .replace(/Shift/g, '')
                                            .replace(/[^A-Za-z0-9]/g, '')
                                            .trim()
                                            .toUpperCase();

                                        value = value.slice(-8);

                                        e.target.value = '';

                                        if (value) {

                                            processScan(value);
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <p style={{ color: 'green' }}>
                        Last Scanned:{" "}
                        <b>
                            {activeTab === 'send'
                                ? lastScannedSend
                                : lastScannedReceive}
                        </b>
                    </p>
                    {/* TABLE */}
                    <DataTable
                        columns={
                            activeTab === 'send'
                                ? [
                                    { name: 'S.No', selector: (r, i) => i + 1 },
                                    { name: 'Part No', selector: r => r.partNo },
                                    { name: 'Packages No', selector: r => r.binNo },
                                    { name: 'Ref No', selector: r => r.referenceNo },
                                    { name: 'Driver Name', selector: r => r.driverName },
                                    { name: 'Driver No', selector: r => r.driverNo },
                                    { name: 'Scan Date & Time', selector: r => r.scanDateTime },
                                    {
                                        name: 'Action',
                                        cell: (_, index) => (
                                            <>
                                                <div style={{ display: 'flex' }}>
                                                    {sendPrivilege.canEdit && (
                                                        <FaEdit
                                                            title="Edit"
                                                            className="action-icon edit-icon"
                                                            onClick={() => handleEdit(index)}
                                                        />
                                                    )}
                                                    {sendPrivilege.canDelete && (
                                                        <FaTrash
                                                            title="Delete"
                                                            className="action-icon delete-icon"
                                                            onClick={() => {
                                                                setDeleteIndex(index);
                                                                setShowDeleteModal(true);
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </>
                                        )
                                    }
                                ]
                                : [
                                    { name: 'S.No', selector: (r, i) => i + 1 },
                                    { name: 'Part No', selector: r => r.partNo },
                                    { name: 'Packages No', selector: r => r.binNo },
                                    { name: 'Ref No', selector: r => r.referenceNo },
                                    { name: 'Driver Name', selector: r => r.driverName },
                                    { name: 'Driver No', selector: r => r.driverNo },
                                    { name: 'Scan Date & Time', selector: r => r.scanDateTime },
                                    {
                                        name: 'Condition',
                                        cell: (row, index) => (
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={row.condition === 'Damaged'}
                                                    onChange={(e) => {
                                                        setReceiveList(prev =>
                                                            prev.map((item, i) =>
                                                                i === index
                                                                    ? {
                                                                        ...item,
                                                                        condition: e.target.checked
                                                                            ? 'Damaged'
                                                                            : 'Good'
                                                                    }
                                                                    : item
                                                            )
                                                        );
                                                    }}
                                                />
                                                <span style={{ marginLeft: 6 }}>Damaged</span>
                                            </div>
                                        )
                                    },

                                    {
                                        name: 'Remarks',
                                        cell: (row, index) => (
                                            <input
                                                value={row.remarks || ''}
                                                placeholder="Enter"
                                                style={{
                                                    width: '100%',
                                                    padding: '4px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px'
                                                }}
                                                onChange={(e) => {
                                                    setReceiveList(prev =>
                                                        prev.map((item, i) =>
                                                            i === index
                                                                ? {
                                                                    ...item,
                                                                    remarks: e.target.value
                                                                }
                                                                : item
                                                        )
                                                    );
                                                }}
                                            />
                                        )
                                    },

                                    {
                                        name: 'Action',
                                        cell: (_, index) => (
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                {receivePrivilege.canEdit && (
                                                    <FaEdit
                                                        title="Edit"
                                                        className="action-icon edit-icon"
                                                        onClick={() => handleEdit(index)}
                                                    />
                                                )}
                                                {receivePrivilege.canDelete && (

                                                    <FaTrash
                                                        title="Delete"
                                                        className="action-icon delete-icon"
                                                        onClick={() => {
                                                            setDeleteIndex(index);
                                                            setShowDeleteModal(true);
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        )
                                    }
                                ]
                        }
                        data={activeTab === 'send' ? sendList : receiveList}
                        dense
                        highlightOnHover
                        striped
                        responsive
                        customStyles={customStyles}
                    />
                    {/* BUTTONS */}
                    <div className="actions">
                        {(
                            activeTab === 'send'
                                ? sendPrivilege.canView
                                : receivePrivilege.canView
                        ) && (

                                <button
                                    className="save"
                                    onClick={handleSave}
                                >
                                    Save
                                </button>
                            )}
                        <button
                            className="clear"
                            onClick={() => handleClearClick()}
                        >
                            Clear
                        </button>
                    </div>
                </>
            )}

            <CModal
                visible={showClearModal}
                onClose={() => setShowClearModal(false)}
                alignment="center"
                backdrop="static"
            >
                <CModalHeader className="border-0 text-center">
                    <CModalTitle className="w-100 text-danger fw-bold">
                        ⚠ Confirm Clear
                    </CModalTitle>
                </CModalHeader>

                <CModalBody className="text-center">
                    <p>Do you want to clear this transaction?</p>
                </CModalBody>

                <CModalFooter className="border-0 d-flex justify-content-center gap-2">
                    <CButton color="secondary" onClick={() => setShowClearModal(false)}>
                        No
                    </CButton>

                    <CButton color="success" onClick={confirmClear}>
                        Yes
                    </CButton>
                </CModalFooter>
            </CModal>

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
                        Are you sure you want to delete bin{" "}
                        <b style={{ color: 'red' }}>
                            {selectedBin?.binNo}
                        </b>?
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
                            {autoReceiveBin}
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
        </div>
    );
};

export default MobileSend;