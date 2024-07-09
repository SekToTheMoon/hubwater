import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useLocation } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";

function I_invoice() {
  const employee_fullname =
    localStorage.getItem("employee_fname") +
    " " +
    localStorage.getItem("employee_lname");
  const [search, setSearch] = useState("");
  const [lotNumbers, setLotNumbers] = useState([]);
  const [productDetail, setProductdetail] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [InvoiceEmployee, setEmployee] = useState("");
  const [values, setValues] = useState({
    invoice_date: moment(new Date()).format("YYYY-MM-DD"),
    invoice_credit: 0,
    invoice_total: 0, //รวมเป็นเงินเท่าไหร่
    invoice_detail: "",
    invoice_vat: true,
    invoice_tax: false,
    invoice_status: "รออนุมัติ",
    /// ต้องมาดูทำไมเซ้ตค่าแบบนี้เริ่มต้น
    employee_id: localStorage.getItem("employee_id"),
    customer_id: "",
    items: [],
    invoice_dateend: moment(new Date()).format("YYYY-MM-DD"),
  });

  const [errors, setErrors] = useState({});
  const [selectcustomer, setSelectCustomer] = useState([]);
  const [selectCustomerDetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const quotation = searchParams.get("quotation");
  const bill = searchParams.get("bill");
  const validationSchema = Yup.object({
    invoice_credit: Yup.number()
      .required("โปรดจำนวนวันเครดิต")
      .min(0, "จำนวนวันเคดิตไม่สามารถติดลบได้")
      .typeError("โปรดใส่เครดิตเป็นตัวเลข"),
    customer_id: Yup.string().required("โปรดเลือกลูกค้า"),
    invoice_date: Yup.date()
      .max(new Date(), "ไม่สามาถาใส่วันที่เกินวันปัจจุบัน")
      .required("โปรดเลือกวันที่ออกใบแจ้งหนี้"),
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

  const checkItem = (items) => {
    const seen = new Set();
    for (let item of items) {
      const key = `${item.product_id}-${item.lot_number}`;
      if (seen.has(key)) {
        return true; // Duplicate found
      }
      seen.add(key);
    }
    const updatedItems = values.items.map((item, index) => ({
      ...item,
      listi_number: index + 1,
    }));
    //เมื่อไม่มี item ควร return true ฤ ป่าว ??
    if (updatedItems.length == 0) return;
    let updatedValues = {
      ...values,
      items: updatedItems,
    };
    // ตรวจสอบว่า `quotation` มีค่าอยู่หรือไม่ ถ้ามีก็เพิ่มเข้าไปใน `updatedValues`
    if (quotation) {
      updatedValues = {
        ...updatedValues,
        quotation_id: quotation,
      };
    }
    // ตรวจสอบว่า `bill` มีค่าอยู่หรือไม่ ถ้ามีก็เพิ่มเข้าไปใน `updatedValues`
    if (bill) {
      updatedValues = {
        ...updatedValues,
        bn_id: bill,
      };
    }
    return updatedValues;
  };
  //เมื่อเลือกสินค้า
  const handleSelectProduct = async (product) => {
    try {
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_img: product.product_img,
        unit_name: product.unit_name,
        listi_total: product.product_price,
        listi_amount: 1,
        lot_number: "", // ค่า lot_number ยังไม่ได้กำหนด
      };
      setProductdetail(newItem);
      fetchLotNumbers(product.product_id);
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

  //เมื่อกดเลือก lot สินค้า
  const handleSelectLotProduct = async (Productlot) => {
    try {
      const updatedProductDetail = { ...productDetail, lot_number: Productlot };
      setValues((prevValues) => ({
        ...prevValues,
        items: [...prevValues.items, updatedProductDetail],
      }));
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };
  // fetch lot ของสินค้า
  const fetchLotNumbers = async (productID) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/selectstock/${productID}`
      );
      setLotNumbers(response.data);
    } catch (error) {
      console.error("Error fetching lot numbers:", error);
    }
  };

  /// fetch product ตอนเปิดหน้าเว็บ
  const fetchProduct = async () => {
    let url = `http://localhost:3001/getproduct/all`;
    if (search !== "") {
      url += `?search=${search}`;
    }
    try {
      const res = await axios.get(url);
      setSelectedProduct(res.data);
    } catch (error) {
      console.log(err);
    }
  };

  // ดึงข้อมูล ใบเสนอราคา
  const fetchQuotation = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/getquotation/${quotation}`
      );
      const quotationDetail = response.data.quotationDetail[0];
      const quotationList = response.data.listqDetail;
      const productDetail = response.data.productDetail;

      //วนเซ้ตค่า list
      quotationList.forEach((list) => {
        productDetail.forEach((product) => {
          if (list.product_id === product.product_id) {
            list.product_name = product.product_name;
            list.product_price = product.product_price;
            list.product_img = product.product_img;
            list.unit_name = product.unit_name;
          }
        });
      });
      const newData = quotationList.map(
        ({
          listq_number,
          listq_price,
          listq_amount,
          listq_total,
          ...rest
        }) => ({
          ...rest,
          listi_number: listq_number,
          listi_price: listq_price,
          listi_amount: listq_amount,
          listi_total: listq_total,
        })
      );
      setEmployee(response.data.employee_name);
      setValues({
        ...values,
        invoice_total: parseFloat(quotationDetail.quotation_total), //รวมเป็นเงินเท่าไหร่
        invoice_detail: quotationDetail.quotation_detail,
        invoice_vat: quotationDetail.quotation_vat,
        invoice_tax: quotationDetail.quotation_tax,
        invoice_credit: quotationDetail.quotation_credit,
        invoice_status: quotationDetail.quotation_status,
        invoice_dateend: moment(new Date())
          .add(quotationDetail.quotation_credit, "days")
          .format("YYYY-MM-DD"),
        employee_id: quotationDetail.employee_id,
        customer_id: quotationDetail.customer_id,
        items: newData || [],
      });
      fetchCustomerDetail(quotationDetail.customer_id);
      fetchCustomerName(quotationDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  // ดึงข้อมูล ใบเสนอราคา
  const fetchBill = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/getbill/${bill}`);
      const bnDetail = response.data.bnDetail[0];
      const bnList = response.data.listbDetail;
      const productDetail = response.data.productDetail;

      //วนเซ้ตค่า list
      bnList.forEach((list) => {
        productDetail.forEach((product) => {
          if (list.product_id === product.product_id) {
            list.product_name = product.product_name;
            list.product_price = product.product_price;
            list.product_img = product.product_img;
            list.unit_name = product.unit_name;
          }
        });
      });
      const newData = bnList.map(
        ({
          listb_number,
          listb_price,
          listb_amount,
          listb_total,
          ...rest
        }) => ({
          ...rest,
          listi_number: listb_number,
          listi_price: listb_price,
          listi_amount: listb_amount,
          listi_total: listb_total,
        })
      );
      setEmployee(response.data.employee_name);
      setValues({
        ...values,
        invoice_total: parseFloat(bnDetail.quotation_total), //รวมเป็นเงินเท่าไหร่
        invoice_detail: bnDetail.quotation_detail,
        invoice_vat: bnDetail.quotation_vat,
        invoice_tax: bnDetail.quotation_tax,
        invoice_credit: bnDetail.quotation_credit,
        invoice_status: bnDetail.quotation_status,
        invoice_dateend: moment(new Date())
          .add(bnDetail.quotation_credit, "days")
          .format("YYYY-MM-DD"),
        employee_id: bnDetail.employee_id,
        customer_id: bnDetail.customer_id,
        items: newData || [],
      });
      fetchCustomerDetail(bnDetail.customer_id);
      fetchCustomerName(bnDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };
  ///////////////////////
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
  /////////////////// การ fetch ลูกค้า กับ รายละเอียดลูกค้า
  const fetchCustomer = async () => {
    try {
      const res = await axios.get("http://localhost:3001/getcustomers");
      setSelectCustomer(res.data);
    } catch (err) {
      console.log(err);
    }
  };
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
  ///////////////////////

  // ฟังก์ชันสำหรับลบรายการสินค้า
  const handleRemoveItem = (index) => {
    setValues((prevValues) => {
      const updatedItems = [...prevValues.items];
      updatedItems.splice(index, 1);
      return { ...prevValues, items: updatedItems };
    });
  };

  //เกี่ยวกับวันที่เครดิต
  const handleCreditChange = (e) => {
    const creditDays = e.target.value;
    const newEndDate = moment(values.invoice_date)
      .add(parseInt(creditDays), "days")
      .format("YYYY-MM-DD");
    setValues({
      ...values,
      invoice_credit: creditDays,
      invoice_dateend: newEndDate,
    });
  };
  const handleEndDateChange = (e) => {
    const endDate = moment(e.target.value);
    const startDate = moment(values.invoice_date);
    const creditDays = endDate.diff(startDate, "days");
    setValues({
      ...values,
      invoice_dateend: e.target.value,
      invoice_credit: creditDays.toString(),
    });
  };
  const handleSearch = () => {
    fetchProduct();
  };
  useEffect(() => {
    if (quotation) {
      fetchQuotation();
    } else if (bill) {
      fetchBill();
    } else {
      fetchCustomer();
      setEmployee(employee_fullname);
    }
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    const total = values.items.reduce((accumulator, currentItem) => {
      return accumulator + parseInt(currentItem.listi_total);
    }, 0);

    setValues((prevValues) => ({
      ...prevValues,
      invoice_total: total, // คำนวณและกำหนดให้เป็นสองตำแหน่งทศนิยม
    }));
  }, [values.items]);
  useEffect(() => {
    values.items.map((list) => {
      list.listi_total;
    });
  }, [values.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedValues = checkItem(values.items);
      if (updatedValues === true) {
        toast.error("มีข้อมูลรายการสินค้าไม่ถูกต้อง", {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        return;
      }
      await validationSchema.validate(updatedValues, { abortEarly: false });
      await handleInsert(updatedValues);
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
        "http://localhost:3001/invoice/insert",
        updatedValues
      );
      console.log("Success:", response.data);
      toast.success("invoice inserted successfully", {
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
      console.error("Error during invoice insertion:", error);
      toast.error("Error during invoice insertion", {
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
        <h1 className="ml-16 text-2xl">สร้างใบแจ้งหนี้</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          {/* model4 สินค้าทั้งหมด */}
          <dialog id="my_modal_4" className="modal">
            <div className="modal-box w-11/12 max-w-5xl">
              <div className="flex justify-between">
                <h3 className="font-bold text-lg">รายชื่อสินค้า</h3>
                <div className="flex">
                  {" "}
                  <label className="input input-bordered flex items-center gap-2">
                    <input
                      type="text"
                      className="grow bg-base-100"
                      placeholder="ค้นหา"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                      className="w-4 h-4 opacity-70"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </label>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSearch()}
                  >
                    ค้นหา
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>รูปสินค้า</th>
                      <th>ชื่อสินค้า</th>
                      <th>ราคาขาย</th>
                      <th>คงเหลือ</th>
                      <th>หน่วยสินค้า</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProduct.map((product) => (
                      <tr key={product.product_id}>
                        <td>
                          <img
                            src={`http://localhost:3001/img/product/${product.product_img}`}
                            alt={product.product_name}
                            className="w-20 h-20"
                          />
                        </td>
                        <td>{product.product_name}</td>
                        <td>{product.product_price}</td>
                        <td>{product.product_amount}</td>
                        <td>{product.unit_name}</td>
                        <td>
                          {/* <button onClick={() => handleSelectProduct(product)}>
                            เลือก
                          </button> */}
                          <button
                            onClick={() => {
                              document.getElementById("my_modal_3").showModal();
                              handleSelectProduct(product);
                            }}
                          >
                            เลือกล็อต
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button, it will close the modal */}
                  <button
                    className="btn"
                    onClick={() => {
                      setSelectedProduct([]);
                      setSearch("");
                    }}
                  >
                    Close
                  </button>
                </form>
              </div>
            </div>
          </dialog>
          {/* model3 ล็อตสินค้า */}
          <dialog id="my_modal_3" className="modal">
            <div className="modal-box w-11/12 max-w-5xl">
              <h3 className="font-bold text-lg">รายชื่อสินค้า</h3>
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>เลขล็อตสินค้า</th>
                      <th>วันที่นำเข้า</th>
                      <th>วันหมดอายุ</th>
                      <th>ราคาทุน</th>
                      <th>จำนวนคงเหลือ</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotNumbers.map((lot_product) => (
                      <tr key={lot_product.lot_number}>
                        <td>{lot_product.lot_number}</td>
                        <td>{lot_product.lot_date}</td>
                        <td>{lot_product.lot_lot_has_exp}</td>
                        <td>{lot_product.lot_price}</td>
                        <td>{lot_product.lot_amount}</td>
                        <td>
                          <button
                            onClick={() =>
                              handleSelectLotProduct(lot_product.lot_number)
                            }
                          >
                            เลือก
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button, it will close the modal */}
                  <button className="btn">Close</button>
                </form>
              </div>
            </div>
          </dialog>
          <form onSubmit={handleSubmit} className="mx-auto w-2/3 2xl:max-w-7xl">
            <div className="mt-5 mb-2 2xl:flex justify-between">
              <div className="form-control w-25 ">
                <label className="label">
                  <span className="">ชื่อลูกค้า</span>
                </label>
                <select
                  className="select select-bordered"
                  value={values.customer_id}
                  onChange={(e) => {
                    const cus = e.target.value;
                    setValues({ ...values, customer_id: cus });
                    fetchCustomerDetail(cus);
                  }}
                >
                  <option value="" disabled>
                    เลือกลูกค้า
                  </option>
                  {values.customer_name && (
                    <option value={values.customer_id} disabled>
                      {values.customer_name}
                    </option>
                  )}
                  {selectcustomer.map((op) => (
                    <option key={op.customer_id} value={op.customer_id}>
                      {op.customer_name}
                    </option>
                  ))}
                </select>
                {errors.customer_id && (
                  <span className="text-error">{errors.customer_id}</span>
                )}
                <label className="label">
                  <span className="">ข้อมูลลูกค้า</span>
                </label>
                <div className="rounded-[12px] border px-3 py-1">
                  {" "}
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
                    type="text"
                    value={
                      values.invoice_vat
                        ? (
                            values.invoice_total * 0.07 +
                            values.invoice_total
                          ).toFixed(0)
                        : values.invoice_total
                    }
                    className="input "
                    readOnly
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">วันที่:</span>
                  </label>
                  <input
                    type="date"
                    value={values.invoice_date}
                    onChange={(e) => {
                      setValues({
                        ...values,
                        invoice_date: e.target.value,
                        invoice_dateend: moment(e.target.value)
                          .add(values.invoice_credit, "days")
                          .format("YYYY-MM-DD"),
                      });
                    }}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                {errors.invoice_date && (
                  <span className="text-error flex justify-end">
                    {errors.invoice_date}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">เครดิต (วัน):</span>
                  </label>
                  <input
                    type="text"
                    value={values.invoice_credit}
                    className="input input-bordered w-1/2"
                    onChange={handleCreditChange}
                  />
                </div>
                {errors.invoice_credit && (
                  <span className="text-error flex justify-end">
                    {errors.invoice_credit}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">ครบกำหนด:</span>
                  </label>
                  <input
                    type="date"
                    value={values.invoice_dateend}
                    onChange={handleEndDateChange}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">พนักงานขาย:</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={InvoiceEmployee}
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
                value={values.invoice_detail}
                className="input input-bordered flex-1"
                onChange={(e) => {
                  setValues({ ...values, invoice_detail: e.target.value });
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
                  <th></th>
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
                        disabled={quotation || bill ? true : false}
                        className="text-center w-16"
                        type="text"
                        value={item.listi_amount || ""}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          const updatedItems = [...values.items];
                          if (newAmount === "" || Number(newAmount) > 0) {
                            updatedItems[index].listi_amount =
                              newAmount === "" ? "" : Number(newAmount);
                            updatedItems[index].listi_total =
                              (newAmount === "" ? 0 : Number(newAmount)) *
                              updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                        onBlur={() => {
                          const updatedItems = [...values.items];
                          if (
                            updatedItems[index].listi_amount === "" ||
                            updatedItems[index].listi_amount === 0
                          ) {
                            updatedItems[index].listi_amount = 1;
                            updatedItems[index].listi_total =
                              1 * updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                      />
                    </td>
                    <td>{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listi_total}</td>
                    {!quotation && !bill && (
                      <td>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                        >
                          ลบ
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {!quotation && !bill && (
                  <tr>
                    <td colSpan="8" className="text-center">
                      <div
                        className="btn"
                        onClick={() => {
                          document.getElementById("my_modal_4").showModal();
                        }}
                      >
                        เพิ่มสินค้า
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <hr />
            <div className="ml-auto w-5/12">
              <div>
                <label className="label ">
                  <span className="my-auto">รวมเป็นเงิน</span>
                  <div className="w1/2">{values.invoice_total}</div>
                </label>
              </div>
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      disabled={quotation || bill ? true : false}
                      type="checkbox"
                      checked={values.invoice_vat}
                      className="checkbox mr-2"
                      onChange={() =>
                        setValues({
                          ...values,
                          invoice_vat: !values.invoice_vat,
                        })
                      }
                    />
                    <span>ภาษีมูลค่าเพิ่ม 7%</span>
                  </label>
                  <div className="w1/2 ">
                    {values.invoice_vat
                      ? (values.invoice_total * 0.07).toFixed(0)
                      : ""}
                  </div>
                </label>
              </div>
              <div>
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                  <div className="w1/2">
                    {values.invoice_vat
                      ? (
                          values.invoice_total * 0.07 +
                          values.invoice_total
                        ).toFixed(0)
                      : values.invoice_total}
                  </div>
                </label>
              </div>
              <hr />
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      disabled={quotation || bill ? true : false}
                      type="checkbox"
                      checked={values.invoice_tax}
                      className="checkbox mr-2"
                      onChange={() =>
                        setValues({
                          ...values,
                          invoice_tax: !values.invoice_tax,
                        })
                      }
                    />
                    <span className="">หักภาษี ณ ที่จ่าย 3%</span>
                  </label>
                  <div className="w1/2">
                    {values.invoice_tax ? values.invoice_total * 0.03 : ""}
                  </div>
                </label>
              </div>
              {values.invoice_tax ? (
                <div>
                  <label className="label">
                    <span className="">ยอดชำระ</span>
                    <div className="w1/2">
                      {(
                        values.invoice_total * 0.07 +
                        values.invoice_total -
                        values.invoice_total * 0.03
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

export default I_invoice;
