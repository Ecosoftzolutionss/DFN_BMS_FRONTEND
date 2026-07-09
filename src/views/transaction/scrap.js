import React, { useEffect, useState } from 'react'
import DataTable from 'react-data-table-component'
import {
    CCard,
    CCardBody,
    CFormInput,
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody
} from '@coreui/react'

import API from '../../api'
import '../../assets/CSS/user.css'

const ScrapDetails = () => {

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

    const [data, setData] = useState([])
    const [filteredData, setFilteredData] = useState([])
    const [search, setSearch] = useState('')

    // ✅ MODAL STATES
    const [showModal, setShowModal] = useState(false)
    const [selectedPartNo, setSelectedPartNo] = useState('')
    const [modalData, setModalData] = useState([])
    const [modalSearch, setModalSearch] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)

    const [modalPage, setModalPage] = useState(1)
    const [modalRowsPerPage, setModalRowsPerPage] = useState(10)

    useEffect(() => {

        loadData(currentPage, rowsPerPage)

    }, [currentPage, rowsPerPage])

    const loadData = async (
        page = currentPage,
        pageSize = rowsPerPage
    ) => {

        try {

            const res = await API.get('/damage/scrap-details', {
                params: {
                    page,
                    pageSize
                }
            })

            setData(res.data.data || [])
            setFilteredData(res.data.data || [])

        } catch {

            setData([])
            setFilteredData([])
        }
    }

    // ✅ MAIN SEARCH
    useEffect(() => {

        const result = data.filter(item =>
            item.partNo?.toLowerCase().includes(search.toLowerCase()) ||
            item.binNo?.toLowerCase().includes(search.toLowerCase()) ||
            item.binMaterialType?.toLowerCase().includes(search.toLowerCase()) ||
            item.binOwner?.toLowerCase().includes(search.toLowerCase())
        )

        setFilteredData(result)

    }, [search, data])

    // ✅ GROUP PART NO
    const groupedData = Object.values(

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

    // ✅ OPEN MODAL
    const openModal = (partNo) => {

        setSelectedPartNo(partNo)

        const filtered = data.filter(x => x.partNo === partNo)

        setModalData(filtered)

        setModalSearch('')

        setShowModal(true)
    }

    // ✅ MODAL SEARCH
    const filteredModalData = modalData.filter(item =>

        item.partNo?.toLowerCase().includes(modalSearch.toLowerCase()) ||

        item.binNo?.toLowerCase().includes(modalSearch.toLowerCase()) ||

        item.binMaterialType?.toLowerCase().includes(modalSearch.toLowerCase()) ||

        item.binOwner?.toLowerCase().includes(modalSearch.toLowerCase())
    )

    // ✅ MAIN GRID
    const columns = [

        {
            name: 'S.No',

            selector: (row, index) =>
                (currentPage - 1) * rowsPerPage + index + 1,

            width: '90px'
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
                    onClick={() => openModal(row.partNo)}
                >
                    {row.partNo}
                </span>
            )
        },

        {
            name: 'Packages Count',
            selector: r => r.binCount
        }
    ]

    // ✅ MODAL GRID
    const modalColumns = [

        {
            name: 'S.No',

            selector: (row, index) =>
                (modalPage - 1) * modalRowsPerPage + index + 1,

            width: '90px'
        },
        {
            name: 'Part No',
            selector: r => r.partNo,
            width: '180px'
        },

        {
            name: 'Packages No',
            selector: r => r.binNo,
            width: '160px'
        },

        {
            name: 'Material',
            selector: r => r.binMaterialType,
            width: '180px'
        },

        {
            name: 'MFG Date',

            selector: r =>

                r.manufactureDate
                    ? new Date(r.manufactureDate)
                        .toLocaleDateString('en-CA')
                    : '',

            width: '160px'
        },

        {
            name: 'Owner',
            selector: r => r.binOwner,
            width: '180px'
        },

        {
            name: 'Size',
            selector: r => r.size,
            width: '130px'
        },

        {
            name: 'Scrap Qty',
            selector: r => r.scrapQty,
            width: '140px'
        }
    ]

    return (

        <>
            <CCard>
                <CCardBody>
                    <h6
                        className="text-center mb-3"
                        style={{
                            fontSize: '18px',
                            fontWeight: '600'
                        }}
                    >
                        Scrap Details
                    </h6>

                    <div className="d-flex justify-content-end mb-2">

                        <CFormInput
                            placeholder="Search..."
                            style={{ width: '200px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <DataTable
                        columns={columns}
                        data={groupedData}
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

                            loadData(page, rowsPerPage)
                        }}
                        onChangeRowsPerPage={(newPerPage, page) => {

                            setRowsPerPage(newPerPage)
                            setCurrentPage(page)

                            loadData(page, newPerPage)
                        }}
                    />
                </CCardBody>
            </CCard>


            <CModal
                visible={showModal}
                size="xl"
                fullscreen="xl"
                onClose={() => setShowModal(false)}
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
                            value={modalSearch}
                            onChange={(e) =>
                                setModalSearch(e.target.value)
                            }
                        />
                    </div>

                    <DataTable
                        columns={modalColumns}
                        data={filteredModalData}
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
        </>
    )
}

export default ScrapDetails