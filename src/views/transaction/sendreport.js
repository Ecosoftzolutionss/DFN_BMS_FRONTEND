import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import API from '../../api'
import { QRCodeCanvas } from "qrcode.react";
import logo from '../../assets/images/Comlogo.png'
import '../../assets/CSS/sendreport.css'

const SendReport = () => {

  const stateCodes = {
    "TN": "TN (33)",
    "KA": "KA (29)",
    "MH": "MH (27)",
    "GJ": "GJ (24)",
    "TS": "TS (36)",
    "AP": "AP (37)"
  };

  const { batchId } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    if (batchId) {
      loadData();
    }

    window.onafterprint = () => {
      if (window.opener) {
        window.close();   
      } else {
        window.history.back(); 
      }
    };

    return () => {
      window.onafterprint = null;
    };
  }, [batchId]);

  const loadData = async () => {
    try {
      const res = await API.get(`/send/report/${batchId}`)
      setData(res.data)
      setTimeout(() => window.print(), 500)
    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message)
    }
  }

  if (!data) return <h5>Loading...</h5>
  const h = data?.header || {};
  const destinationCode = stateCodes[h.state] || h.state || "";
  const rdcId = `RDC-${new Date(h.scanDateTime).getFullYear()}-${h.id?.toString().padStart(6, '0')}`;
  const qrValue = `
  RDC ID : ${rdcId}
  Parts : ${data.parts.map(p => p.partNo).join(', ')}
  Qty : ${data.parts.map(p => p.quantity).join(', ')}
  Total Qty : ${data.totalQty}
`.trim();


  return (
    <div id="print-area">
      <div className="report">
        <div className="header-row">
          <img src={logo} className="logo" />
          <h4 className="title">Returnable Packaging Challan</h4>
          <div>{new Date(h.scanDateTime).toLocaleDateString()}</div>
        </div>

        {/* TOP ROW */}
        <div className="top-row">
          <div>
            <b>RDC ID :</b> {rdcId}
          </div>
          <div>
            <b>Quantity :</b> {data.totalQty}
          </div>
        </div>

    
        <div className="address-container">
          <div className="address-box">
            <div>
              <div className="box-title">Origin Address</div>
              <div className="box-content">
                Delfingen India PVT LTD <br />
                Indospace Industrial and Logistics Park, 500-C <br />
                Oragadam, Panruti <br />
                Chennai, Tamil Nadu 631604
              </div>
            </div>

            <div>
              <div className="box-title">Destination Address</div>
              <div className="box-content">
                {h.address || ""}
              </div>
            </div>
          </div>

          {/* STATE ROW */}
          <div className="state-row">

            <div className="state-block">
              <span className="state-name">
                Tamil Nadu, India
              </span>

              <span className="state-code">
                TN (33)
              </span>
            </div>

            <div className="state-block">
              <span className="state-name">
                {h.state === "MH" ? "Maharashtra, India" :
                  h.state === "KA" ? "Karnataka, India" :
                    h.state === "TN" ? "Tamil Nadu, India" :
                      h.state === "GJ" ? "Gujarat, India" :
                        h.state === "TS" ? "Telangana, India" :
                          h.state === "AP" ? "Andhra Pradesh, India" :
                            h.state}
              </span>

              <span className="state-code">
                {destinationCode}
              </span>
            </div>

          </div>

        </div>
        {/* TABLE */}
        <table className="report-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Part No</th>
              <th>Quantity</th>
            </tr>
          </thead>
          <tbody>
            {data.parts.map((p, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{p.partNo}</td>
                <td>{p.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="footer-box">
          <div className="footer-item">
            <div className="box-title">Scan to verify</div>
            <QRCodeCanvas
              value={qrValue}
              size={100}
              includeMargin={true}
            />
          </div>

          <div className="footer-item">
            <div className="box-title">Transport Details</div>
            <p>Vehicle No : {h.vehicleNo}</p>
            <p>Driver Name : {h.driverName}</p>
            <p>Driver No : {h.driverNo}</p>
          </div>

          <div className="footer-item">
            <div className="box-title">Authorised Signature</div>
            <div className="sign-line"></div>
          </div>
        </div>


        <div className="declaration">
          <b>Declaration:</b>
          <p>
            hereby certify that the goods mentioned above are returnable packaging
            materials being transported for temporary use. This movement does not
            constitute a sale, and this document is not a tax invoice. All items are
            to be returned to the sender in good condition.
          </p>
        </div>

      </div>
    </div>
  )
}

export default SendReport