import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";

function I_quotation() {
  const employee_fname = localStorage.getItem("employee_fname");
  const employee_lname = localStorage.getItem("employee_lname");
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
    employee_id: localStorage.getItem("employee_id"),
    customer_id: "",
    items: [],
    quotation_dateend: moment(new Date()).format("YYYY-MM-DD"),
  });

  const [errors, setErrors] = useState({});
  const [selectcustomer, setSelectCustomer] = useState([]);
  const [selectcustomerdetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
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

  //เมื่อเลือกสินค้า
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
    try {
      const res = await axios.get("http://localhost:3001/getproduct/all");
      setSelectedProduct(res.data);
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

  useEffect(() => {
    fetchCustomer();
    fetchProduct();
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    const total = values.items.reduce((accumulator, currentItem) => {
      return accumulator + parseInt(currentItem.listq_total);
    }, 0);

    setValues((prevValues) => ({
      ...prevValues,
      quotation_total: total, // คำนวณและกำหนดให้เป็นสองตำแหน่งทศนิยม
    }));
  }, [values.items]);
  useEffect(() => {
    values.items.map((list) => {
      list.listq_total;
    });
  }, [values.items]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await validationSchema.validate(values, { abortEarly: false });
      await handleInsert();
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

  const handleInsert = async () => {
    try {
      const response = await axios.post(
        "http://localhost:3001/quotation/insert",
        values
      );
      console.log("Success:", response.data);
      toast.success("quotation inserted successfully", {
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

  return (
    <>
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">สร้างใบเสนอราคา</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          {/* model4 สินค้าทั้งหมด */}
          <dialog id="my_modal_4" className="modal">
            <div className="modal-box w-11/12 max-w-5xl">
              <h3 className="font-bold text-lg">รายชื่อสินค้า</h3>
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
                  <button className="btn">Close</button>
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
              <div className="form-control w-25">
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
                <textarea
                  disabled
                  readOnly
                  className="textarea textarea-bordered"
                  placeholder="รายละเอียดที่อยู่"
                  value={selectcustomerdetail.data.customer_address}
                ></textarea>

                <input
                  readOnly
                  type="text"
                  placeholder="เลขประจำตัวผู้เสียภาษี"
                  value={selectcustomerdetail.data.le_tax}
                  disabled
                  className="input w-full max-w-xs "
                />
                <input
                  readOnly
                  type="text"
                  placeholder="สำนักงาน"
                  value={selectcustomerdetail.data.le_name}
                  disabled
                  className="input w-full max-w-xs "
                />
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
                    value={employee_fname + " " + employee_lname}
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

export default I_quotation;
