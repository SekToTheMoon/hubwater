import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

function View_receipt() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const receipt = searchParams.get("receipt");

  const [receiptEmployee, setEmployee] = useState("");
  const [selectCustomerDetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const [values, setValues] = useState({
    receipt_date: moment(new Date()).format("YYYY-MM-DD"),
    receipt_total: 0,
    receipt_detail: "",
    receipt_vat: true,
    receipt_tax: false,
    employee_id: "",
    customer_id: "",
    items: [],
  });

  const fetchCustomerDetail = async (customer_id) => {
    try {
      const res = await axios.get(
        "http://localhost:3001/getcustomer/" + customer_id
      );
      setSelectCustomerDetail({
        data: res.data.data[0],
        zip_code: res.data.zip_code[0].zip_code,
      });
    } catch (err) {
      console.log(err);
    }
  };

  // ดึงข้อมูล ใบแจ้งหนี้
  const fetchReceipt = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/getreceipt/${receipt}`
      );
      const rcDetail = response.data.rcDetail[0];
      const receiptList = response.data.listrDetail;
      const productDetail = response.data.productDetail;

      //วนเซ้ตค่า list
      receiptList.forEach((list) => {
        productDetail.forEach((product) => {
          if (list.product_id === product.product_id) {
            list.product_name = product.product_name;
            list.product_price = product.product_price;
            list.product_img = product.product_img;
            list.unit_name = product.unit_name;
          }
        });
      });
      setEmployee(response.data.employee_name);
      setValues({
        ...values,
        receipt_total: parseFloat(rcDetail.rc_total),
        receipt_detail: rcDetail.rc_detail,
        receipt_vat: rcDetail.rc_vat,
        receipt_tax: rcDetail.rc_tax,
        employee_id: rcDetail.employee_id,
        customer_id: rcDetail.customer_id,
        items: receiptList || [],
      });
      fetchCustomerDetail(rcDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, []);
  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  return (
    <>
      <div className="rounded-box bg-base-100 p-5 min-h-full">
        <h1 className="ml-32 text-2xl text-slate-500">ใบเสร็จรับเงิน</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <div className="mx-auto w-2/3 pr-12 2xl:max-w-5xl ">
            <div className="flex justify-end mt-3">
              <button
                className="btn btn-info text-base-100"
                onClick={() => {
                  axios.get(`http://localhost:3001/pdf?id=${receipt}`);
                }}
              >
                print / download
              </button>
            </div>
            <div className=" mb-2 2xl:flex justify-between">
              <div className="form-control w-25">
                <label className="label">
                  <span className="">ชื่อลูกค้า</span>
                </label>
                <div className="input input-bordered flex items-center">
                  {selectCustomerDetail.data.customer_fname +
                    " " +
                    selectCustomerDetail.data.customer_lname}
                </div>

                <label className="label mt-3">
                  <span className="">ข้อมูลลูกค้า</span>
                </label>
                <div className="textarea textarea-bordered px-3 py-1">
                  <label className="label">
                    <span className="">
                      {selectCustomerDetail.data.customer_address
                        ? "รายละเอียดที่อยู่ : " +
                          selectCustomerDetail.data.customer_address
                        : "รายละเอียดที่อยู่ : ไม่มี"}
                    </span>
                  </label>
                  <label className="label">
                    <span className="">
                      {selectCustomerDetail.data.le_tax
                        ? "เลขประจำตัวผู้เสียภาษี : " +
                          selectCustomerDetail.data.le_tax
                        : "เลขประจำตัวผู้เสียภาษี : ไม่มี"}
                    </span>
                  </label>
                  <label className="label">
                    <span className="">
                      {selectCustomerDetail.data.le_name
                        ? "สำนักงาน :" + selectCustomerDetail.data.le_name
                        : "สำนักงาน : ไม่มี"}
                    </span>
                  </label>
                </div>
              </div>
              <div className="w-50 ">
                <div className="form-control">
                  <label className="label">
                    <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={
                      values.receipt_vat
                        ? (values.receipt_total * 1.07).toFixed(0)
                        : values.receipt_total
                    }
                    className="input text-3xl"
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">วันที่:</span>
                  </label>
                  <input
                    type="date"
                    value={values.receipt_date || ""}
                    className="input input-bordered w-1/2"
                    readOnly
                  />
                </div>
                <div className="flex justify-between row-span-2">
                  <label className="label">
                    <span className="">พนักงานขาย:</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={receiptEmployee}
                    className="input input-bordered w-1/2"
                  />
                </div>
              </div>
            </div>
            <hr />
            <div className="flex mt-2">
              <label className="label">
                <span className="">รายละเอียด:</span>
              </label>
              <input
                type="text"
                className="input input-bordered flex-1"
                value={values.receipt_detail}
                readOnly
              />
            </div>
            <table className="w-full mt-3">
              <thead className="bg-base-200 text-left">
                <tr className="border-b text-center ">
                  <th className="py-3">ลำดับ</th>
                  <th>ชื่อสินค้า</th>
                  <th>รูปสินค้า</th>
                  <th>ล็อตสินค้า</th>
                  <th>จำนวนสินค้า</th>
                  <th>หน่วย</th>
                  <th>ราคาต่อหน่วย</th>
                  <th>ราคารวม</th>
                </tr>
              </thead>
              <tbody>
                {values.items.map((item, index) => (
                  <tr key={index} className="text-center">
                    <td>{index + 1}</td>
                    <td>{item.product_name}</td>
                    <td>
                      <div className="avatar">
                        <div className="w-20 rounded">
                          <img
                            src={`http://localhost:3001/img/product/${item.product_img}`}
                            alt="Product"
                          />
                        </div>
                      </div>
                    </td>
                    <td>{item.lot_number}</td>
                    <td>
                      <input
                        readOnly
                        className="text-center w-16"
                        type="text"
                        value={item.listr_amount || ""}
                      />
                    </td>
                    <td>{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listr_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
            <div className="ml-auto w-5/12 mt-3">
              <div>
                <label className="label ">
                  <span className="my-auto">รวมเป็นเงิน</span>
                  <div className="w1/2">{values.receipt_total}</div>
                </label>
              </div>
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      disabled={true}
                      type="checkbox"
                      checked={values.receipt_vat}
                      className="checkbox mr-2"
                      value={values.receipt_vat}
                    />
                    <span>ภาษีมูลค่าเพิ่ม 7%</span>
                  </label>
                  <div className="w1/2 ">
                    {values.receipt_vat
                      ? (values.receipt_total * 0.07).toFixed(0)
                      : ""}
                  </div>
                </label>
              </div>
              <div>
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                  <div className="w1/2">
                    {values.receipt_vat
                      ? (values.receipt_total * 1.07).toFixed(0)
                      : values.receipt_total}
                  </div>
                </label>
              </div>
              <hr />
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      disabled={true}
                      type="checkbox"
                      checked={values.receipt_tax}
                      className="checkbox mr-2"
                    />
                    <span className="">หักภาษี ณ ที่จ่าย 3%</span>
                  </label>
                  <div className="w1/2">
                    {values.receipt_tax ? values.receipt_total * 0.03 : ""}
                  </div>
                </label>
              </div>
              {values.receipt_tax ? (
                <div>
                  <label className="label">
                    <span className="">ยอดชำระ</span>
                    <div className="w1/2">
                      {(
                        values.receipt_total * 0.07 +
                        values.receipt_total -
                        values.receipt_total * 0.03
                      ).toFixed(0)}
                    </div>
                  </label>
                </div>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default View_receipt;
