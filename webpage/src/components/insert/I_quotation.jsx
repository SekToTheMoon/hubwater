import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";

function I_quotation() {
  const employee_id = localStorage.getItem("employee_id");
  const employee_fname = localStorage.getItem("employee_fname");
  const employee_lname = localStorage.getItem("employee_lname");
  const [lotNumbers, setLotNumbers] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [values, setValues] = useState({
    quotation_id: "",
    quotation_date: new Date(),
    quotation_status: "",
    quotation_credit: 0,
    quotation_total: "",
    quotation_detail: "",
    quotation_vat: "",
    quotation_tax: "",
    employee_id: "",
    customer_id: "",
    items: [],
    quotation_dateend: new Date(),
  });

  const [errors, setErrors] = useState({});
  const [selectcustomer, setSelectCustomer] = useState([]);
  const [selectcustomerdetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const validationSchema = Yup.object({});

  const handleSelectProduct = async (product) => {
    try {
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_img: product.product_img,
        unit_name: product.unit_name,
        listq_total: product.listq_total,
        listq_amount: product.listq_amount,
        lot_number: "", // ค่า lot_number ยังไม่ได้กำหนด
      };

      // Fetch lot numbers for the selected product
      const lotResponse = await axios.get(
        `http://localhost:3001/selectstock/${product.product_id}`
      );

      // Update lot numbers state
      setLotNumbers(lotResponse.data);

      // Add the new item to the values state
      setValues((prevValues) => ({
        ...prevValues,
        items: [...prevValues.items, newItem],
      }));
    } catch (error) {
      console.error("Error selecting product:", error);
    }
  };

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

  const handleSelectChange = (e, index) => {
    const newLotNumber = e.target.value;
    setValues((prevValues) => ({
      ...prevValues,
      items: prevValues.items.map((item, i) => {
        if (index === i) {
          return { ...item, lot_number: newLotNumber };
        }
        return item;
      }),
    }));
  };

  const fetchLotNumbers = async (productId) => {
    try {
      const response = await axios.get(
        `http://localhost:3001/selectstock/${productId}`
      );
      setLotNumbers(...lotNumbers, response.data);
    } catch (error) {
      console.error("Error fetching lot numbers:", error);
    }
  };

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
    console.log(creditDays);
    console.log(newEndDate);
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

  const fetchProduct = async () => {
    try {
      const res = await axios.get("http://localhost:3001/getproduct/all");
      setSelectedProduct(res.data);
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  useEffect(() => {
    fetchProduct();
  }, []);

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
                          <button onClick={() => handleSelectProduct(product)}>
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

                <label className="label">
                  <span className="">ข้อมูลลูกค้า</span>
                </label>
                <textarea
                  disabled
                  className="textarea textarea-bordered"
                  placeholder="รายละเอียดที่อยู่"
                  value={selectcustomerdetail.data.customer_address}
                ></textarea>

                <input
                  type="text"
                  placeholder="เลขประจำตัวผู้เสียภาษี"
                  value={selectcustomerdetail.data.le_tax}
                  disabled
                  className="input w-full max-w-xs "
                />
                <input
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
                  <input type="text" value="0.00" className="input " readOnly />
                </div>

                <div className="flex justify-between">
                  <label className="label">
                    <span className="">วันที่:</span>
                  </label>
                  <input
                    type="date"
                    selected={values.quotation_date}
                    onChange={(e) => {
                      setValues({ ...values, quotation_date: e.target.value });
                      if (values.quotation_credit === 0) {
                        setValues({
                          ...values,
                          quotation_dateend: e.target.value,
                        });
                      }
                    }}
                    dateformat="yyyy-MM-dd"
                    className="input input-bordered w-1/2 "
                  />
                </div>
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
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">ครบกำหนด:</span>
                  </label>
                  <input
                    type="date"
                    selected={values.quotation_dateend}
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
            <table className="table text-base">
              <thead>
                <tr className=" text-base">
                  <th>ลำดับ</th>
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
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.product_name}</td>
                    <td>
                      <img
                        src={`http://localhost:3001/img/product/${item.product_img}`}
                        alt="Product"
                      />
                    </td>
                    <td>
                      <select
                        value={item.lot_number}
                        onChange={(e) => handleSelectChange(e, index)}
                      >
                        <option value="">เลือกล็อต</option>
                        {lotNumbers.map((lot) => (
                          <option key={lot.lot_number} value={lot.lot_number}>
                            {lot.lot_number}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={item.product_amount}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          setValues((prevValues) => ({
                            ...prevValues,
                            items: prevValues.items.map((item, i) => {
                              if (index === i) {
                                return { ...item, product_amount: newAmount };
                              }
                              return item;
                            }),
                          }));
                        }}
                      />
                    </td>
                    <td>{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>
                      {parseFloat(item.product_price) *
                        parseInt(item.product_amount)}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan="8" className="text-center">
                    <div
                      className="btn"
                      onClick={() => {
                        document.getElementById("my_modal_4").showModal();
                        fetchProduct();
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
                  <div className="w1/2">0.00</div>
                </label>
              </div>
              <div className="flex justify-between">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="checkbox mr-2"
                  />
                  <span>ภาษีมูลค่าเพิ่ม 7%</span>
                </label>
                <div className="w1/2 my-auto">0.00</div>
              </div>
              <div className="flex justify-between mb-2">
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                </label>
                <div className="w1/2 my-auto">0.00</div>
              </div>
              <hr />
              <div className="flex justify-between">
                <label className="label cursor-pointer">
                  <input type="checkbox" className="checkbox mr-2" />
                  <span className="">หักภาษี ณ ที่จ่าย 3%</span>
                </label>
                <div className="w1/2 my-auto">0.00</div>
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
