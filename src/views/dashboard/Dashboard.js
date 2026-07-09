import React, { useEffect, useState } from "react";
import {
  CCard,
  CCardBody,
  CCardTitle,
  CRow,
  CCol,
  CButton,
  CFormSelect,
  CFormInput,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody
} from "@coreui/react";

import DataTable from "react-data-table-component";

import {
  getCustomerStatus,
  getPlantSummary,
  getBinDetails,
  getCustomerBinDetails
} from "../api/dashboard";
import '../../assets/CSS/user.css';
import usePrivilege from '../hooks/usePrivilege';
import '../../assets/CSS/dashboard.css';
import Icon4 from "../../assets/images/Icon 4.png";
import API from '../../api'
import AvailableIcon from '../../assets/images/cusavailable.png';
import IntransitIcon from '../../assets/images/cusintransit.png';
import DamagedIcon from '../../assets/images/cusdamaged.png';
import WarningIcon from '../../assets/images/cuswarning.png';
import truckImg from '../../assets/images/truck.png';

const Dashboard = () => {

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

  const [tab, setTab] = useState("customer");
  const [customers, setCustomers] = useState([]);
  const [plant, setPlant] = useState({});
  const [binData, setBinData] = useState([]);
  const [allBinData, setAllBinData] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDetails, setCustomerDetails] = useState([]);
  const [customerHeader, setCustomerHeader] = useState({});
  const [isCenterView, setIsCenterView] = useState(false);
  const [centerTab, setCenterTab] = useState("available");
  const [searchText, setSearchText] = useState("");
  const [totalDelayed, setTotalDelayed] = useState(0);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [showPartModal, setShowPartModal] = useState(false);
  const [partBins, setPartBins] = useState([]);
  const [selectedPartNo, setSelectedPartNo] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [overdueData, setOverdueData] = useState([]);
  const [showOverdue, setShowOverdue] = useState(false);
  const [overduePartBins, setOverduePartBins] = useState([]);
  const [partFilter, setPartFilter] = useState('');
  const [mainPage, setMainPage] = useState(1)
  const [mainRowsPerPage, setMainRowsPerPage] = useState(10)
  const [modalPage, setModalPage] = useState(1)
  const [modalRowsPerPage, setModalRowsPerPage] = useState(10)
  const [customerPage, setCustomerPage] = useState(1)
  const [customerRowsPerPage, setCustomerRowsPerPage] = useState(10)
  const { privileges } = usePrivilege()

  const canViewDashboard = privileges.some(
    p => p.menuName === 'Dashboard' && p.canView
  )

  const loadOverdueBins = async () => {
    const res = await API.get('/dashboard/overdue-bins')
    setOverdueData(res.data)
    setShowOverdue(true)
  }

  useEffect(() => {
    loadData();
    loadMaterials();
  }, [tab]);

  const loadData = async (search = "") => {
    const plantRes = await getPlantSummary();
    setPlant(plantRes.data);

    if (tab === "customer") {
      const res = await getCustomerStatus(search);
      setCustomers(res.data);
    } else {
      loadBinData("all");
    }
  };

const openPartBins = async (
  partNo,
  isOverdue = false,
  customerName = ''
) => {

  setPartSearch('');

  // Overdue
  if (isOverdue) {
    const res = await API.get(
      `/dashboard/overdue-bin-details/${partNo}/${customerName}`
    );

    setOverduePartBins(res.data);
    setSelectedPartNo(partNo);
    setShowPartModal(true);
    return;
  }

  // Packages At Customer
  if (centerTab === "customer") {

    const res = await API.get(
      `/dashboard/customer-part-bins/${partNo}/${customerName}`
    );

    setPartBins(res.data);
    setSelectedPartNo(partNo);
    setShowPartModal(true);
    return;
  }

  // Available / Damaged
  const filtered =
    binData.filter(x => x.partNo === partNo);

  setPartBins(filtered);
  setSelectedPartNo(partNo);
  setShowPartModal(true);
}

  const loadMaterials = async () => {
    const res = await API.get('/materials')
    setMaterials(res.data)
  }

  const loadTotalDelayed = async () => {
    const res = await API.get("/dashboard/total-delayed");
    setTotalDelayed(res.data);
  };

  useEffect(() => {
    loadTotalDelayed();
  }, []);

  const loadBinData = async (type) => {

    const res = await getBinDetails(type);
    setBinData(res.data);
    setAllBinData(res.data);
  };

  const groupedBinData =
    Object.values(
      binData.reduce((acc, item) => {
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

  const handleCustomerClick = async (c) => {
    setSelectedCustomer(c);
    setIsCenterView(false);

    const res = await getCustomerBinDetails(c.customerId);
    setCustomerDetails(res.data);

    if (res.data.length > 0) {

      const latest =
        [...res.data]
          .sort((a, b) => b.id - a.id)[0]

      setCustomerHeader(latest)
    }
  };

  const handleBack = () => {
    setSelectedCustomer(null);
    setCustomerDetails([]);
  };
  const getCardColor = (index) => {
    const colors = [
      "#ff9800",
      "#4caf50",
      "#2196f3",
      "#9c27b0",
      "#00bcd4",
      "#ffc107"
    ];
    return colors[index % colors.length];
  };
  const getPosition = (index, total) => {
    if (!total) return {};

    const radius = 30;
    const centerX = 50;
    const centerY = 50;

    const angle = (index / total) * (2 * Math.PI);

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    return {
      position: "absolute",
      top: `${y}%`,
      left: `${x}%`,
      transform: "translate(-50%, -50%)"
    };
  };

  const filteredPartBins = partBins.filter(item =>

    item.partNo?.toString()
      .toLowerCase()
      .includes(partSearch.toLowerCase())

    ||

    item.binNo?.toLowerCase()
      .includes(partSearch.toLowerCase())
  )

  const filteredGroupedData =
    groupedBinData.filter(item =>

      item.partNo?.toLowerCase()
        .includes(partFilter.toLowerCase())
    )

  if (canViewDashboard) {
    return (
      <div style={{ padding: "20px", background: "#f5f7fb", minHeight: "100vh" }}>

        {/* TOP TABS */}
        <div style={{ marginBottom: "20px" }}>
          <CButton
            color={tab === "customer" ? "dark" : "secondary"}
            onClick={() => {
              setTab("customer");
              setSelectedCustomer(null);
              setIsCenterView(false);

              // ✅ CLEAR FILTERS
              setSelectedMaterial('');
              setBinData(allBinData);
            }}
          >
            Customer Status
          </CButton>

          <CButton
            color={tab === "bin" ? "dark" : "secondary"}
            className="ms-2"
            onClick={() => {
              setTab("bin");
              setSelectedCustomer(null);
              setIsCenterView(false);

              // ✅ RESET DROPDOWN
              setSelectedMaterial('');

              loadBinData("all");
            }}
          >
            Packages Status
          </CButton>
        </div>

        {/* ================= CUSTOMER DASHBOARD ================= */}
        {tab === "customer" && !selectedCustomer && !isCenterView && (
          <>
            <CCard className="mb-4 shadow">
              <CCardBody>
                <div style={{ marginBottom: "15px", textAlign: "right" }}>
                  <CFormInput
                    placeholder="Search customer..."
                    style={{ width: "250px", display: "inline-block" }}
                    value={searchText}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchText(val);
                      loadData(val);
                    }}
                  />
                </div>
                <div className="flow-container">
                  <svg className="connection-lines">
                    {customers.map((c, i) => {
                      const pos = getPosition(i, customers.length);
                      return (
                        <line
                          key={i}
                          x1="50%"
                          y1="50%"
                          x2={pos.left}
                          y2={pos.top}
                          stroke="#cfd8dc"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                  <div
                    className="center-box"
                    onClick={() => {
                      setIsCenterView(true);
                      setCenterTab("available");
                      loadBinData("available");

                    }}
                    style={{ cursor: "pointer" }}
                  >


                    <div className="card-header">
                      <img src={Icon4} alt="plant" className="title-icon" />
                      <h6>DELFINGEN (Plant)</h6>
                    </div>
                    <p>Total: {plant.total}</p>
                    <p className="green">Available: {plant.available}</p>
                    <p className="red">Damaged: {plant.damaged}</p>
                    <p className="blue">At Customer: {plant.atCustomer}</p>
                    <div className="warning-box">
                      <img src={WarningIcon} alt="warning" className="warning-icon" />
                      <span className="red">Overdue Packages: {totalDelayed}</span>
                    </div>
                  </div>

                  {/* ✅ MOVE TRUCK HERE (NOT INSIDE CENTER) */}
                  {customers.map((c, i) => {
                    if (c.inTransit <= 0) return null;
                    const pos = getPosition(i, customers.length);
                    return (
                      <div
                        key={"truck-" + i}
                        className="moving-truck"
                        style={{
                          "--endX": pos.left,
                          "--endY": pos.top
                        }}
                      >
                        <img
                          src={truckImg}
                          alt="truck"
                          className="truck-icon-img"
                        />
                        <span className="truck-count">{c.inTransit}</span>
                      </div>
                    );
                  })}


                  {customers.map((c, i) => (
                    <div
                      key={i}
                      className="customer-card"
                      style={{
                        ...getPosition(i, customers.length),
                        borderLeft: `6px solid ${getCardColor(i)}`
                      }}
                      onClick={() => handleCustomerClick(c)}
                    >
                      <div className="card-header">
                        <img src={Icon4} alt="cust" className="card-icon" />
                        <h6>{c.customerName}</h6>
                      </div>

                      <div className="row-item">
                        <span className="label-with-icon">
                          <img src={AvailableIcon} alt="available" className="status-icon" />
                          Available
                        </span>
                        <span className="green">{c.available}</span>
                      </div>

                      {c.inTransit > 0 && (
                        <div className="row-item">
                          <span className="label-with-icon">
                            <img src={IntransitIcon} alt="available" className="status-icon" />
                            In Transit</span>
                          <span style={{ color: "blue" }}>
                            {c.inTransit}
                          </span>
                        </div>
                      )}

                      <div className="row-item">
                        <span className="label-with-icon">
                          <img src={DamagedIcon} alt="available" className="status-icon" />
                          Damaged</span>
                        <span className="red">{c.damaged}</span>
                      </div>

                      {c.delayed > 0 && (
                        <div className="delay-box">
                          <img src={WarningIcon} alt="warning" className="delay-icon" />
                          <span>{c.delayed} Delayed</span>
                        </div>
                      )}
                    </div>
                  ))}

                </div>

              </CCardBody>
            </CCard>
          </>
        )}
        {/* ================= CENTER VIEW (NO BUTTONS) ================= */}
        {isCenterView && (
          <CCard className="shadow">
            <CCardBody>

              <CButton color="light" onClick={() => setIsCenterView(false)}>
                ← Back
              </CButton>

              {/* ONLY 3 TABS */}
              <div className="mt-3 mb-3">
                <CButton
                  color={centerTab === "available" ? "dark" : "secondary"}
                  onClick={() => {
                    setCenterTab("available");
                    loadBinData("available");
                    setShowOverdue(false)
                  }}
                >
                  Available Packages
                </CButton>

                <CButton
                  className="mx-2"
                  color={centerTab === "damaged" ? "dark" : "secondary"}
                  onClick={() => {
                    setShowOverdue(false)
                    setCenterTab("damaged");
                    loadBinData("damaged");
                  }}
                >
                  Damaged Packages
                </CButton>

                <CButton
                  color={centerTab === "customer" ? "dark" : "secondary"}
                  onClick={() => {
                    setShowOverdue(false)
                    setCenterTab("customer");
                    loadBinData("customer");
                  }}
                >
                  Packages at Customer
                </CButton>

                <CButton
                  className="ms-2"
                  color={showOverdue ? "danger" : "secondary"}
                  onClick={() => loadOverdueBins()}
                >
                  Overdue Packages
                </CButton>
              </div>



              {showOverdue ? (
                <>
                  <h5 className="text-center mb-3">
                    Overdue Packages Details
                  </h5>

                  <div className="d-flex justify-content-end mb-3">

                    <CFormInput
                      placeholder="Filter Part No"
                      style={{ width: '250px' }}
                      value={partFilter}
                      onChange={(e) =>
                        setPartFilter(e.target.value)
                      }
                    />

                  </div>

                  <DataTable
                    columns={[

                      {
                        name: "S.No",
                        cell: (row, i) =>
                          i + 1 + (modalPage - 1) * modalRowsPerPage,
                        width: "100px"
                      },

                      {
                        name: "Customer Name",
                        selector: row => row.customerName
                      },

                      {
                        name: "Part Number",

                        cell: row => (

                          <span
                            style={{
                              color: "#0d6efd",
                              cursor: "pointer",
                              fontWeight: "600"
                            }}
                            onClick={() =>
                              openPartBins(
                                row.partNo,
                                true,
                                row.customerName
                              )
                            }
                          >
                            {row.partNo}
                          </span>
                        )
                      },

                      {
                        name: "Packages Count",
                        selector: row => row.binCount,
                        center: true
                      },

                      {
                        name: "Overdue Days",
                        selector: row => row.overdueDays,
                        center: true
                      }

                    ]}

                    data={
                      overdueData.filter(item =>

                        item.partNo?.toLowerCase()
                          .includes(partFilter.toLowerCase())

                        ||

                        item.customerName?.toLowerCase()
                          .includes(partFilter.toLowerCase())
                      )
                    }

                    pagination
                    striped
                    highlightOnHover
                    responsive
                    customStyles={customStyles}
                    paginationPerPage={10}

                    onChangePage={(page) =>
                      setModalPage(page)
                    }

                    onChangeRowsPerPage={(newPerPage, page) => {
                      setModalRowsPerPage(newPerPage)
                      setModalPage(page)
                    }}
                  />

                </>

              ) : (

                <>

                  <h5 className="text-center mb-3">
                    {centerTab === "available" && "Available Packages Details"}
                    {centerTab === "damaged" && "Damaged Packages Details"}
                    {centerTab === "customer" && "Packages at Customer Details"}
                  </h5>

                  <div className="d-flex justify-content-end mb-3">

                    <CFormInput
                      placeholder="Filter Part No"
                      style={{ width: '250px' }}
                      value={partFilter}
                      onChange={(e) =>
                        setPartFilter(e.target.value)
                      }
                    />

                  </div>

                  <DataTable
                    columns={
                      centerTab === "customer"
                        ? [
                          {
                            name: "S.No",
                            cell: (row, i) =>
                              i + 1 + (modalPage - 1) * modalRowsPerPage,
                            width: "100px"
                          },
                          {
                            name: "Customer Name",
                            selector: row => row.customerName
                          },
                          {
                            name: "Part No",
                            cell: row => (
                              <span
                                style={{
                                  color: "#0d6efd",
                                  cursor: "pointer",
                                  fontWeight: "600"
                                }}
                                onClick={() =>
                                  openPartBins(
                                    row.partNo,
                                    false,
                                    row.customerName
                                  )
                                }
                              >
                                {row.partNo}
                              </span>
                            )
                          },
                          {
                            name: "Packages Count",
                            selector: row => row.binCount,
                            center: true
                          }
                        ]
                        : [
                          {
                            name: "S.No",
                            cell: (row, i) =>
                              i + 1 + (modalPage - 1) * modalRowsPerPage,
                            width: "100px"
                          },
                          {
                            name: "Part No",
                            cell: row => (
                              <span
                                style={{
                                  color: "#0d6efd",
                                  cursor: "pointer",
                                  fontWeight: "600"
                                }}
                                onClick={() => openPartBins(row.partNo)}
                              >
                                {row.partNo}
                              </span>
                            )
                          },
                          {
                            name: "Packages Count",
                            selector: row => row.binCount,
                            center: true
                          }
                        ]
                    }

                    data={
                      centerTab === "customer"
                        ? binData
                        : filteredGroupedData
                    }
                    pagination
                    striped
                    highlightOnHover
                    responsive
                    customStyles={customStyles}
                    paginationPerPage={10}
                    onChangePage={(page) =>
                      setModalPage(page)
                    }

                    onChangeRowsPerPage={(newPerPage, page) => {
                      setModalRowsPerPage(newPerPage)
                      setModalPage(page)
                    }}
                  />
                </>
              )}
            </CCardBody>
          </CCard>
        )}
        {/* ================= CUSTOMER DETAILS ================= */}
        {selectedCustomer && (
          <CCard className="shadow mt-4">
            <CCardBody>
              <CButton color="light" onClick={handleBack}>
                ← Back to Dashboard
              </CButton>

              <div className="title-header mt-3">
                <img src={Icon4} alt="icon" className="title-icon" />
                <h5>
                  {selectedCustomer.customerName} - Latest Send Packages Details
                </h5>
              </div>

              <div className="details-header">

                {/* Vehicle */}
                <div className="detail-box">
                  <span className="label">Vehicle No :</span>
                  <div className="value vehicle">
                    🚚 {customerHeader.vehicleNo}
                  </div>
                </div>

                {/* Driver Name */}
                <div className="detail-box">
                  <span className="label">Driver Name :</span>
                  <div className="value driver">
                    👤 {customerHeader.driverName}
                  </div>
                </div>

                {/* Driver No */}
                <div className="detail-box">
                  <span className="label">Driver No :</span>
                  <div className="value phone">
                    📞 {customerHeader.driverNo}
                  </div>
                </div>

              </div>

              <DataTable
                columns={[
                  {
                    name: "S.No",
                    cell: (row, i) =>
                      i + 1 + (customerPage - 1) * customerRowsPerPage
                  },

                  {
                    name: "Part No",
                    selector: row => row.partNo
                  },

                  {
                    name: "Packages Type",
                    selector: row => row.binMaterialType
                  },

                  {
                    name: "Packages No",
                    selector: row => row.binNo
                  },

                  {
                    name: "Reference No",
                    selector: row => row.referenceNo
                  },

                  {
                    name: "Date & Time",
                    selector: row => row.scanDateTime
                  }
                ]}
                data={customerDetails}
                pagination
                striped
                highlightOnHover
                responsive
                customStyles={customStyles}
                paginationPerPage={10}
                onChangePage={(page) =>
                  setCustomerPage(page)
                }

                onChangeRowsPerPage={(newPerPage, page) => {
                  setCustomerRowsPerPage(newPerPage)
                  setCustomerPage(page)
                }}
              />
            </CCardBody>
          </CCard>
        )}
        {/* ================= BIN TAB ================= */}
        {tab === "bin" && (
          <CCard className="shadow">
            <CCardBody>

              {/* FILTER SECTION */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                  gap: "10px"
                }}
              >
                <CFormSelect
                  value={selectedMaterial}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedMaterial(value)
                    if (!value) {
                      setBinData(allBinData)
                      return
                    }
                    const filtered = allBinData.filter(
                      x => x.binMaterialType === value
                    )

                    setBinData(filtered)
                  }}
                  style={{ width: "220px" }}
                >
                  <option value="">All Material Types</option>

                  {materials.map(m => (
                    <option key={m.id} value={m.materialName}>
                      {m.materialName}
                    </option>
                  ))}
                </CFormSelect>

                <CFormInput
                  placeholder="Search here"
                  style={{ width: "250px" }}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
                    const filtered = allBinData.filter(x =>
                      x.binNo?.toLowerCase().includes(val) ||
                      x.partNo?.toLowerCase().includes(val)
                    );
                    setBinData(filtered);
                  }}
                />
              </div>

              {/* TABLE */}
              <DataTable
                columns={[

                  {
                    name: "S.No",
                    cell: (row, i) =>
                      i + 1 + (mainPage - 1) * mainRowsPerPage,
                    width: "100px"
                  },

                  {
                    name: "Part No",

                    cell: row => (

                      <span
                        style={{
                          color: "#0d6efd",
                          cursor: "pointer",
                          fontWeight: "600"
                        }}
                        onClick={() => openPartBins(row.partNo)}
                      >
                        {row.partNo}
                      </span>
                    )
                  },

                  {
                    name: "Packages Count",
                    selector: row => row.binCount,
                    center: true
                  }
                ]}
                data={groupedBinData}
                pagination
                striped
                responsive
                highlightOnHover
                customStyles={customStyles}
                onChangePage={(page) =>
                  setMainPage(page)
                }

                onChangeRowsPerPage={(newPerPage, page) => {
                  setMainRowsPerPage(newPerPage)
                  setMainPage(page)
                }}
              />
            </CCardBody>
          </CCard>
        )}

        <CModal
          visible={showPartModal}
          size="lg"
          onClose={() => {
            setShowPartModal(false)
            setPartSearch('')
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
                placeholder="Search here"
                style={{ width: '220px' }}
                value={partSearch}
                onChange={(e) => setPartSearch(e.target.value)}
              />
            </div>

            <DataTable
              columns={
                showOverdue
                  ? [

                    {
                      name: "S.No",
                      cell: (row, i) =>
                        i + 1 + (modalPage - 1) * modalRowsPerPage,
                      width: "100px"
                    },

                    {
                      name: "Customer Name",
                      selector: row => row.customerName
                    },

                    {
                      name: "Part Number",
                      selector: row => row.partNo
                    },

                    {
                      name: "Packages No",
                      selector: row => row.binNo
                    },

                    {
                      name: "Overdue Days",
                      selector: row => row.overdueDays,
                      center: true
                    }

                  ]

                  : [
                    {
                      name: "S.No",
                      cell: (row, i) =>
                        i + 1 + (modalPage - 1) * modalRowsPerPage,
                      width: "100px"
                    },

                    {
                      name: "Part No",
                      selector: row => row.partNo
                    },

                    {
                      name: "Packages No",
                      selector: row => row.binNo
                    }
                  ]
              }

              data={
                showOverdue
                  ? overduePartBins.filter(item =>
                    item.partNo?.toLowerCase()
                      .includes(partSearch.toLowerCase())
                    ||
                    item.binNo?.toLowerCase()
                      .includes(partSearch.toLowerCase())
                    ||
                    item.customerName?.toLowerCase()
                      .includes(partSearch.toLowerCase())
                  )
                  : filteredPartBins
              }
              pagination
              striped
              responsive
              highlightOnHover
              customStyles={customStyles}
              paginationPerPage={10}

              onChangePage={(page) =>
                setModalPage(page)
              }

              onChangeRowsPerPage={(newPerPage, page) => {
                setModalRowsPerPage(newPerPage)
                setModalPage(page)
              }}
            />
          </CModalBody>
        </CModal>
      </div>
    );
  }
};

export default Dashboard;