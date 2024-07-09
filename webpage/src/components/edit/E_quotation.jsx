import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";

function E_quotation() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [lotNumbers, setLotNumbers] = useState([]);
  const [productDetail, setProductdetail] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [values, setValues] = useState({
    quotation_date: moment(new Date()).format("YYYY-MM-DD"),
    quotation_credit: 0,
    quotation_total: 0, //รวมเป็นเงินเท่าไหร่
    quotation_detail: "",
    quotation_vat: true,
    quotation_tax: false,
    employee_id: "",
    customer_id: "",
    items: [],
    quotation_dateend: moment(new Date()).format("YYYY-MM-DD"),
  });
  const [quotationEmployee, setEmployee] = useState("");
  const [selectCustomer, setSelectCustomer] = useState([]);
  const [selectCustomerDetail, setselectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const [errors, setErrors] = useState({});
  const validationSchema = Yup.object({
    quotation_credit: Yup.number()
      .required("โปรดจำนวนวันเครดิต")
      .min(0, "จำนวนวันเคดิตไม่สามารถติดลบได้")
      .typeError("โปรดใส่เครดิตเป็นตัวเลข"),
    customer_id: Yup.string().required("โปรดเลือกลูกค้า"),
    quotation_date: Yup.date()
      .max(new Date(), "ไม่สามาถาใส่วันที่เกินวันปัจจุบัน")
      .required("โปรดเลือกวันที่ออกใบเสนอราคา"),
    items: Yup.array().of(
      Yup.object().shape({
        product_id: Yup.string().required("โปรดเลือกสินค้า"),
        listq_amount: Yup.number()
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
      listq_number: index + 1,
    }));

    if (updatedItems.length == 0) return;
    const updatedValues = {
      ...values,
      items: updatedItems,
    };
    return updatedValues;
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };
  // ดึงข้อมูล ใบเสนอราคา
  const fetchQuotation = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/getquotation/${id}`
      );
      const quotationDetail = response.data.quotationDetail[0];
      const quotationList = response.data.listqDetail;
      const productDetail = response.data.productDetail;

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

      setEmployee(response.data.employee_name);
      setValues({
        quotation_date: moment(quotationDetail.quotation_date).format(
          "YYYY-MM-DD"
        ),
        quotation_credit: quotationDetail.quotation_credit,
        quotation_total: parseFloat(quotationDetail.quotation_total), //รวมเป็นเงินเท่าไหร่
        quotation_detail: quotationDetail.quotation_detail,
        quotation_vat: quotationDetail.quotation_vat,
        quotation_tax: quotationDetail.quotation_tax,
        employee_id: quotationDetail.employee_id,
        customer_id: quotationDetail.customer_id,
        items: quotationList || [],
        quotation_dateend: moment(quotationDetail.quotation_dateend).format(
          "YYYY-MM-DD"
        ),
      });
      fetchCustomerDetail(quotationDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
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
  /// fetch product ตอนกดปุ่มเพิ่มสินค้า
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
      setselectCustomerDetail({
        data: res.data.data[0],
        zip_code: res.data.zip_code[0].zip_code,
      });
    } catch (err) {
      console.log(err);
    }
  };
  // ฟังก์ชันสำหรับลบรายการสินค้า
  const handleRemoveItem = (index) => {
    setValues((prevValues) => {
      const updatedItems = [...prevValues.items];
      updatedItems.splice(index, 1);
      return { ...prevValues, items: updatedItems };
    });
  };
  //เมื่อเลือกสินค้าจะทำการ fetch lot ของสินค้า
  const handleSelectProduct = async (product) => {
    try {
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_img: product.product_img,
        unit_name: product.unit_name,
        listq_total: product.product_price,
        listq_amount: 1,
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

  ///////////////////////

  //เกี่ยวกับวันที่เครดิต
  const handleCreditChange = (e) => {
    const creditDays = e.target.value;
    const newEndDate = moment(values.quotation_date)
      .add(parseInt(creditDays), "days")
      .format("YYYY-MM-DD");
    setValues({
      ...values,
      quotation_credit: creditDays,
      quotation_dateend: newEndDate,
    });
  };
  const handleEndDateChange = (e) => {
    const endDate = moment(e.target.value);
    const startDate = moment(values.quotation_date);
    const creditDays = endDate.diff(startDate, "days");
    setValues({
      ...values,
      quotation_dateend: e.target.value,
      quotation_credit: creditDays.toString(),
    });
  };
  const handleSearch = () => {
    fetchProduct();
  };
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
      await validationSchema.validate(values, { abortEarly: false });
      await handleEdit(updatedValues);
      // setErrors({});
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
  const handleEdit = async (updatedValues) => {
    try {
      const response = await axios.put(
        "http://localhost:3001/quotation/edit/" + id,
        updatedValues
      );
      console.log("Success:", response.data);
      toast.success("quotation inserted successfully", {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      // setTimeout(
      //   () => navigate("/all/quotation", { state: { msg: response.data } }),
      //   4000
      // );
    } catch (error) {
      console.error("Error during quotation insertion:", error);
      toast.error("Error during quotation insertion", {
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
  useEffect(() => {
    fetchCustomer();
    fetchQuotation();
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    const total = values.items.reduce((accumulator, currentItem) => {
      return accumulator + parseInt(currentItem.listq_total);
    }, 0);
    ////อย่าลืมมาลบ
    if (values.items.length > 0) {
      setValues((prevValues) => ({
        ...prevValues,
        quotation_total: total, // คำนวณและกำหนดให้เป็นสองตำแหน่งทศนิยม
      }));
    }
  }, [values.items]);

  return (
    <>
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
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">แก้ไขใบเสนอราคา</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form onSubmit={handleSubmit} className="mx-auto w-2/3 2xl:max-w-7xl">
            <div className="mt-5 mb-2 2xl:flex justify-between">
              <div className="form-control w-25">
                <label className="label">
                  <span className="">ชื่อลูกค้า</span>
                </label>
                <select
                  className="select select-bordered"
                  name="customer_id"
                  value={values.customer_id}
                  onChange={(e) => {
                    handleChange(e);
                    fetchCustomerDetail(e.target.value);
                  }}
                >
                  <option value="" disabled>
                    เลือกลูกค้า
                  </option>
                  {selectCustomer.map((op) => (
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
                      values.quotation_vat
                        ? (
                            values.quotation_total * 0.07 +
                            values.quotation_total
                          ).toFixed(0)
                        : values.quotation_total
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
                    value={values.quotation_date}
                    onChange={(e) => {
                      setValues({
                        ...values,
                        quotation_date: e.target.value,
                        quotation_dateend: moment(e.target.value)
                          .add(values.quotation_credit, "days")
                          .format("YYYY-MM-DD"),
                      });
                    }}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                {errors.quotation_date && (
                  <span className="text-error flex justify-end">
                    {errors.quotation_date}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">เครดิต (วัน):</span>
                  </label>
                  <input
                    type="text"
                    value={values.quotation_credit}
                    className="input input-bordered w-1/2"
                    onChange={handleCreditChange}
                  />
                </div>
                {errors.quotation_credit && (
                  <span className="text-error flex justify-end">
                    {errors.quotation_credit}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">ครบกำหนด:</span>
                  </label>
                  <input
                    type="date"
                    value={values.quotation_dateend}
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
                    value={quotationEmployee}
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
                value={values.quotation_detail}
                onChange={(e) => {
                  setValues({ ...values, quotation_detail: e.target.value });
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
                        className="text-center w-16"
                        type="text"
                        value={item.listq_amount || ""}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          const updatedItems = [...values.items];
                          if (newAmount === "" || Number(newAmount) > 0) {
                            updatedItems[index].listq_amount =
                              newAmount === "" ? "" : Number(newAmount);
                            updatedItems[index].listq_total =
                              (newAmount === "" ? 0 : Number(newAmount)) *
                              updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                        onBlur={() => {
                          const updatedItems = [...values.items];
                          if (
                            updatedItems[index].listq_amount === "" ||
                            updatedItems[index].listq_amount === 0
                          ) {
                            updatedItems[index].listq_amount = 1;
                            updatedItems[index].listq_total =
                              1 * updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                      />
                    </td>
                    <td>{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listq_total}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="ml-2 px-2 py-1 bg-red-500 text-white rounded"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
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
              </tbody>
            </table>
            <hr />
            <div className="ml-auto w-5/12">
              <div>
                <label className="label ">
                  <span className="my-auto">รวมเป็นเงิน</span>
                  <div className="w1/2">{values.quotation_total}</div>
                </label>
              </div>
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.quotation_vat}
                      className="checkbox mr-2"
                      onChange={() =>
                        setValues({
                          ...values,
                          quotation_vat: !values.quotation_vat,
                        })
                      }
                    />
                    <span>ภาษีมูลค่าเพิ่ม 7%</span>
                  </label>
                  <div className="w1/2 ">
                    {values.quotation_vat
                      ? (values.quotation_total * 0.07).toFixed(0)
                      : ""}
                  </div>
                </label>
              </div>
              <div>
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                  <div className="w1/2">
                    {values.quotation_vat
                      ? (
                          values.quotation_total * 0.07 +
                          values.quotation_total
                        ).toFixed(0)
                      : values.quotation_total}
                  </div>
                </label>
              </div>
              <hr />
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      checked={values.quotation_tax}
                      className="checkbox mr-2"
                      onChange={() =>
                        setValues({
                          ...values,
                          quotation_tax: !values.quotation_tax,
                        })
                      }
                    />
                    <span className="">หักภาษี ณ ที่จ่าย 3%</span>
                  </label>
                  <div className="w1/2">
                    {values.quotation_tax ? values.quotation_total * 0.03 : ""}
                  </div>
                </label>
              </div>
              {values.quotation_tax ? (
                <div>
                  <label className="label">
                    <span className="">ยอดชำระ</span>
                    <div className="w1/2">
                      {(
                        values.quotation_total * 0.07 +
                        values.quotation_total -
                        values.quotation_total * 0.03
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

export default E_quotation;
