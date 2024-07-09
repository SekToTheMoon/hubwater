import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";

function I_receipt() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const invoice = searchParams.get("invoice");

  const [receiptEmployee, setEmployee] = useState("");
  const [errors, setErrors] = useState({});
  const [selectCustomerDetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const [values, setValues] = useState({
    receipt_date: moment(new Date()).format("YYYY-MM-DD"),
    receipt_total: 0, //รวมเป็นเงินเท่าไหร่
    receipt_detail: "",
    receipt_vat: true,
    receipt_tax: false,
    employee_id: "",
    customer_id: "",
    customer_name: "",
    iv_id: invoice,
    items: [],
  });

  const validationSchema = Yup.object({
    customer_id: Yup.string().required("โปรดเลือกลูกค้า"),
    receipt_date: Yup.date()
      .max(new Date(), "ไม่สามาถาใส่วันที่เกินวันปัจจุบัน")
      .required("โปรดเลือกวันที่ออกใบเสร็จรับเงิน"),
    items: Yup.array().of(
      Yup.object().shape({
        product_id: Yup.string().required("โปรดเลือกสินค้า"),
        listi_amount: Yup.number()
          .required("โปรดระบุจำนวนสินค้า")
          .min(1, "จำนวนสินค้าต้องมากกว่า 0"),
        lot_number: Yup.string().required("โปรดเลือก Lot number"),
      })
    ),
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

  const fetchCustomerName = async (customer_id) => {
    try {
      const res = await axios.get(
        "http://localhost:3001/getcustomers?sqlWhere=" + customer_id
      );
      setValues((prevState) => ({
        ...prevState,
        customer_name: res.data[0].customer_name,
      }));
    } catch (err) {
      console.log(err);
    }
  };

  // ดึงข้อมูล ใบแจ้งหนี้
  const fetchInvoice = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/getinvoice/${invoice}`
      );
      const rcDetail = response.data.ivDetail[0];
      const receiptList = response.data.listiDetail;
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
        receipt_total: parseFloat(rcDetail.iv_total), //รวมเป็นเงินเท่าไหร่
        receipt_detail: rcDetail.iv_detail,
        receipt_vat: rcDetail.iv_vat,
        receipt_tax: rcDetail.iv_tax,
        employee_id: rcDetail.employee_id,
        customer_id: rcDetail.customer_id,
        items: receiptList || [],
      });
      fetchCustomerDetail(rcDetail.customer_id);
      fetchCustomerName(rcDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };
  ///////////////////////

  useEffect(() => {
    fetchInvoice();
  }, []);
  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      await handleInsert(values);
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error.inner.forEach((err) => {
        console.log(err.path);
        newErrors[err.path] = err.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async (updatedValues) => {
    try {
      const response = await axios.post(
        "http://localhost:3001/receipt/insert",
        updatedValues
      );
      console.log("Success:", response.data);
      toast.success("receipt inserted successfully", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } catch (error) {
      console.error("Error during receipt insertion:", error);
      toast.error("Error during receipt insertion", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  return (
    <>
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">สร้างใบเสร็จรับเงิน</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form onSubmit={handleSubmit} className="mx-auto w-2/3 2xl:max-w-7xl">
            <div className="mt-5 mb-2 2xl:flex justify-between">
              <div className="form-control w-25">
                <label className="label">
                  <span className="">ชื่อลูกค้า</span>
                </label>
                <select
                  readOnly
                  className="select select-bordered"
                  value={values.customer_id}
                >
                  <option value={values.customer_id} disabled>
                    {values.customer_name}
                  </option>
                </select>
                {errors.customer_id && (
                  <span className="text-error">{errors.customer_id}</span>
                )}
                <label className="label">
                  <span className="">ข้อมูลลูกค้า</span>
                </label>
                <div className="rounded-[12px] border px-3 py-1">
                  <label className="label">
                    <span className="">
                      {" "}
                      {selectCustomerDetail.data.customer_address
                        ? "รายละเอียดที่อยู่ : " +
                          selectCustomerDetail.data.customer_address
                        : "รายละเอียดที่อยู่ : ไม่มี"}
                    </span>
                  </label>
                  <label className="label">
                    <span className="">
                      {" "}
                      {selectCustomerDetail.data.le_tax
                        ? "เลขประจำตัวผู้เสียภาษี : " +
                          selectCustomerDetail.data.le_tax
                        : "เลขประจำตัวผู้เสียภาษี : ไม่มี"}
                    </span>
                  </label>
                  <label className="label">
                    <span className="">
                      {" "}
                      {selectCustomerDetail.data.le_name
                        ? "สำนักงาน :" + selectCustomerDetail.data.le_name
                        : "สำนักงาน : ไม่มี"}
                    </span>
                  </label>
                </div>
              </div>
              <div className="w-50">
                <div className="form-control">
                  <label className="label">
                    <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={
                      values.receipt_vat
                        ? (
                            values.receipt_total * 0.07 +
                            values.receipt_total
                          ).toFixed(0)
                        : values.receipt_total
                    }
                    className="input "
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
                    onChange={(e) => {
                      setValues({
                        ...values,
                        receipt_date: e.target.value,
                      });
                    }}
                  />
                </div>
                {errors.receipt_date && (
                  <span className="text-error flex justify-end">
                    {errors.receipt_date}
                  </span>
                )}
                <div className="flex justify-between">
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
                onChange={(e) => {
                  setValues({ ...values, receipt_detail: e.target.value });
                }}
              />
            </div>
            {/* ตาราง */}
            <table className="w-full">
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
                        value={item.listi_amount || ""}
                      />
                    </td>
                    <td>{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listi_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
            <div className="ml-auto w-5/12">
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
                      ? (
                          values.receipt_total * 0.07 +
                          values.receipt_total
                        ).toFixed(0)
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

            <button type="submit" className="btn btn-primary w-full mb-5">
              ตกลง
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </>
  );
}

export default I_receipt;
