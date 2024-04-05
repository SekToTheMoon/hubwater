import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";

function I_quotation() {
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
    quotation_dateend: new Date(),
  });
  const [items, setItem] = useState([
    {
      product_id: "",
      product_name: "",
      product_price: "",
      product_img: [],
      listq_total: "",
      listq_amount: "",
      lot_number: "",
    },
  ]);
  const [errors, setErrors] = useState({});
  const [selectcustomer, setSelectCustomer] = useState([]);
  const [selectcustomerdetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const [images, setImage] = useState([]);
  const [imageURL, setImageURL] = useState(null);
  const validationSchema = Yup.object({});

  const fetchCustomer = async () => {
    await axios
      .get("http://localhost:3001/getcustomers")
      .then((res) => {
        setSelectCustomer(res.data);
      })
      .catch((err) => console.log(err));
  };
  const fetchCustomerDetail = async (customer_id) => {
    await axios
      .get("http://localhost:3001/getcustomer/" + customer_id)
      .then((res) => {
        setSelectCustomerDetail({
          data: res.data.data[0],
          zip_code: res.data.zip_code[0].zip_code,
        });
      })
      .catch((err) => console.log(err));
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
    await axios
      .get("http://localhost:3001/getproduct/all")
      .then((res) => {
        setSelectCustomer(res.data);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    fetchCustomer();
  }, []);
  useEffect(() => {}, []);
  useEffect(() => {
    if (images.length !== 1) return;

    const newImageURL = URL.createObjectURL(images[0]);
    setImageURL(newImageURL);
    console.log(images);

    return () => {
      // Cleanup เมื่อ Component ถูก unmount
      URL.revokeObjectURL(newImageURL);
    };
  }, [images]);

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
                  className="input w-full max-w-xs"
                />
                <input
                  type="text"
                  placeholder="สำนักงาน"
                  value={selectcustomerdetail.data.le_name}
                  disabled
                  className="input w-full max-w-xs"
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
                    value="ชื่อพนักงาน"
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
                  <th>ล็อตสินค้า</th>
                  <th>จำนวนสินค้า</th>
                  <th>หน่วย</th>
                  <th>ราคาต่อหน่วย</th>
                  <th>ราคารวม</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan="7" className="text-center">
                    <div className="text-base btn btn-xs sm:btn-sm md:btn-md lg:btn-lg">
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
                  <input
                    type="checkbox"
                    defaultChecked
                    className="checkbox mr-2"
                  />
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
