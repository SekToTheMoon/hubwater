import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";
import useAuth from "../../hooks/useAuth";
import addListIndex from "../../utils/addListIndex";
import ProductModel from "../component/ProductModel";
function I_receiptcash() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  const employee_fname = localStorage.getItem("employee_fname");
  const employee_lname = localStorage.getItem("employee_lname");

  const [values, setValues] = useState({
    rf_date: moment(new Date()).format("YYYY-MM-DD"),
    disc_cash: (0).toFixed(2),
    disc_percent: "",
    rf_total: 0, //รวมเป็นเงินเท่าไหร่
    rf_detail: "",
    rf_vat: true,
    rf_tax: false,
    employee_id: auth.employee_id,
    customer_id: "",
    items: [],
  });
  const [totalBeforeDisc, setTotalBeforeDisc] = useState(0);
  const [errors, setErrors] = useState({});
  const [selectcustomer, setSelectCustomer] = useState([]);
  const [selectCustomerDetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const validationSchema = Yup.object({
    rf_date: Yup.date()
      .max(new Date(), "ไม่สามาถาใส่วันที่เกินวันปัจจุบัน")
      .required("โปรดเลือกวันที่ออกใบเสร็จรับเงิน(สด)"),
    disc_cash: Yup.number()
      .required("โปรดใส่จำนวนเงินส่วนลด")
      .typeError("โปรดใส่จำนวนเงินเป็นตัวเลข")
      .test(
        "disc_cash",
        "ส่วนลดไม่สามารถมากกว่าราคาสินค้าทั้งหมด",
        function (value) {
          const { rf_total } = this.parent;
          return value < rf_total + value;
        }
      ),
    items: Yup.array()
      .of(
        Yup.object().shape({
          product_id: Yup.string().required("โปรดเลือกสินค้า"),
          listrf_amount: Yup.number()
            .required("โปรดระบุจำนวนสินค้า")
            .min(1, "จำนวนสินค้าต้องมากกว่า 0"),
          lot_number: Yup.string().required("โปรดเลือก Lot number"),
        })
      )
      .min(1, "โปรดเพิ่มสินค้า")
      .test("items", "มีสินค้าที่ ล็อต ซ้ำกัน", function (value) {
        if (!value) return true; // หาก array ว่างเปล่าให้ผ่านการตรวจสอบ

        const uniqueItems = new Set(
          value.map((item) => `${item.product_id}-${item.lot_number}`)
        );

        return uniqueItems.size === value.length;
      }),
  });

  // ฟังก์ชันสำหรับลบรายการสินค้า
  const handleRemoveItem = (index) => {
    setValues((prevValues) => {
      const updatedItems = [...prevValues.items];
      updatedItems.splice(index, 1);
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + parseFloat(item.listrf_total),
        0
      );
      return {
        ...prevValues,
        items: updatedItems,
        rf_total: newTotal.toFixed(2),
      };
    });
  };

  /////////////////// การ fetch ลูกค้า กับ รายละเอียดลูกค้า
  const fetchCustomer = async () => {
    try {
      const res = await axios.get("/getcustomers");
      setSelectCustomer(res.data);
    } catch (err) {
      console.log(err);
    }
  };
  const fetchCustomerDetail = async (customer_id) => {
    try {
      const res = await axios.get("/getcustomer/" + customer_id);
      setSelectCustomerDetail({
        data: res.data.data[0],
        zip_code: res.data.zip_code[0].zip_code,
      });
    } catch (err) {
      console.log(err);
    }
  };
  ///////////////////////

  useEffect(() => {
    fetchCustomer();
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    // ทำการรวมราคาสินค้าก่อนลดราคาใหม่
    const newTotalBeforeDisc = values.items
      .reduce((accumulator, currentItem) => {
        return accumulator + parseFloat(currentItem.listrf_total);
      }, 0)
      .toFixed(2);

    setTotalBeforeDisc(newTotalBeforeDisc);

    // เช็คค่ามี disc_percent ไหม ถ้ามีเซ็ต disc_cash ตามเปอร์เซ็นต์
    let newDisc_cash = parseFloat(values.disc_cash);
    if (values.disc_percent && values.disc_percent > 0) {
      newDisc_cash = newTotalBeforeDisc * (values.disc_percent / 100);
    }

    setValues((prevValues) => ({
      ...prevValues,
      rf_total: (newTotalBeforeDisc - newDisc_cash).toFixed(2),
      disc_cash: newDisc_cash.toFixed(2),
    }));
  }, [values.items, values.disc_percent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedRequestValues = addListIndex(values, "list_number");
      await validationSchema.validate(updatedRequestValues, {
        abortEarly: false,
      });
      await handleInsert(updatedRequestValues);
      setErrors({});
      // navigate("/receiptcash");
    } catch (error) {
      console.log(error);
      const newErrors = {};
      error?.inner.forEach((err) => {
        console.log(err?.path);
        newErrors[err?.path] = err?.message;
      });
      setErrors(newErrors);
    }
  };

  const handleInsert = async (updatedValues) => {
    try {
      const response = await axios.post("/receiptcash/insert", updatedValues);
      toast.success("receiptCash inserted successfully", {
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
      console.error("Error during receiptCash insertion:", error);
      toast.error("Error during receiptCash insertion", {
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
      <ProductModel
        setValues={setValues}
        list={["listrf_total", "listrf_amount"]}
      />
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">สร้างใบเสร็จรับเงิน(สด)</h1>
        <hr className="my-4" />
        <div className="flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full xl:w-full xl:max-w-4xl"
          >
            <div className="mt-5 w-full mb-2 xl:flex justify-between">
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
                  <option value="">Cash Sale / ขายเงินสด</option>
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
                      values.rf_vat
                        ? (values.rf_total * 1.07).toFixed(0)
                        : values.rf_total
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
                    value={values.rf_date}
                    onChange={(e) => {
                      setValues({
                        ...values,
                        rf_date: e.target.value,
                      });
                    }}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                {errors.rf_date && (
                  <span className="text-error flex justify-end">
                    {errors.rf_date}
                  </span>
                )}

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
                value={values.rf_detail}
                onChange={(e) => {
                  setValues({ ...values, rf_detail: e.target.value });
                }}
              />
            </div>
            {/* ตาราง */}
            <table className="w-full">
              <thead className="bg-base-200 text-left">
                <tr className="border-b text-center ">
                  <th className="py-3">ลำดับ</th>
                  <th>ชื่อสินค้า</th>
                  <th className="hidden lg:table-cell">รูปสินค้า</th>
                  <th className="hidden md:table-cell">ล็อตสินค้า</th>
                  <th>จำนวนสินค้า</th>
                  <th className="hidden sm:table-cell">หน่วย</th>
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
                    <td className="hidden lg:table-cell">
                      <div className="avatar p-2">
                        <div className="w-20 rounded">
                          <img
                            src={`http://localhost:3001/img/product/${item.product_img}`}
                            alt="Product"
                          />
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">{item.lot_number}</td>
                    <td>
                      <input
                        className="text-center w-16"
                        type="text"
                        value={item.listrf_amount || ""}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          const updatedItems = [...values.items];
                          if (newAmount === "" || Number(newAmount) > 0) {
                            updatedItems[index].listrf_amount =
                              newAmount === "" ? "" : Number(newAmount);
                            updatedItems[index].listrf_total =
                              (newAmount === "" ? 0 : Number(newAmount)) *
                              updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                        onBlur={() => {
                          const updatedItems = [...values.items];
                          if (
                            updatedItems[index].listrf_amount === "" ||
                            updatedItems[index].listrf_amount === 0
                          ) {
                            updatedItems[index].listrf_amount = 1;
                            updatedItems[index].listrf_total =
                              1 * updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                      />
                    </td>
                    <td className="hidden sm:table-cell">{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listrf_total}</td>
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
                      className="btn m-5"
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
            {errors.items && <span className="text-error">{errors.items}</span>}
            <hr />
            <div className="ml-auto md:w-10/12 md:max-w-72 lg:w-6/12 xl:w-5/12">
              <label className="label ">
                <span className="my-auto">รวมเป็นเงิน</span>
                <div>{totalBeforeDisc}</div>
              </label>
              <label className="label ">
                <div>
                  <span className="my-auto">ส่วนลด</span>
                  <input
                    type="text"
                    value={values.disc_percent}
                    placeholder="0"
                    className="ml-1 max-w-8 text-center"
                    onChange={(e) => {
                      let disc = parseInt(e.target.value);
                      disc =
                        isNaN(disc) || disc < 1 ? "" : disc > 100 ? 100 : disc;
                      const handleDisc =
                        disc == ""
                          ? (0).toFixed(2)
                          : ((disc / 100) * totalBeforeDisc).toFixed(2);
                      setValues({
                        ...values,
                        disc_percent: disc,
                        disc_cash: handleDisc,
                        rf_total: (totalBeforeDisc - handleDisc).toFixed(2),
                      });
                    }}
                  />
                  <span>%</span>
                </div>
                <div className="w-1/2">
                  <input
                    type="text"
                    value={values.disc_cash}
                    className="text-right w-full"
                    onChange={(e) => {
                      let disc = e.target.value;

                      // อนุญาตให้ป้อนตัวเลข จุดทศนิยม และตัวเลขหลังจุดทศนิยมเท่านั้น
                      if (/^\d*\.?\d*$/.test(disc)) {
                        const numericDisc = parseFloat(disc);
                        const handleDisc =
                          isNaN(numericDisc) || numericDisc < 0
                            ? 0
                            : numericDisc;

                        setValues({
                          ...values,
                          rf_total: (totalBeforeDisc - handleDisc).toFixed(2),
                          disc_cash: disc, // เก็บค่า input เป็น string
                          disc_percent: "",
                        });
                      }
                    }}
                    onBlur={() => {
                      setValues({
                        ...values,
                        disc_cash: parseFloat(
                          values.disc_cash ? values.disc_cash : 0
                        ).toFixed(2),
                      });
                    }}
                  />
                </div>
              </label>
              <label className="label">
                <span className="">ราคาหลังหักส่วนลด</span>
                <div>{values.rf_total}</div>
              </label>
              {errors.disc_cash && (
                <span className="text-error flex justify-end">
                  {errors.disc_cash}
                </span>
              )}
              <label className="label">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    checked={values.rf_vat}
                    className="checkbox mr-2"
                    value={values.rf_vat}
                    onChange={() =>
                      setValues({
                        ...values,
                        rf_vat: !values.rf_vat,
                      })
                    }
                  />
                  <span>ภาษีมูลค่าเพิ่ม 7%</span>
                </label>
                <div>
                  {values.rf_vat ? (values.rf_total * 0.07).toFixed(2) : ""}
                </div>
              </label>
              <label className="label">
                <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                <div>
                  {values.rf_vat
                    ? (values.rf_total * 1.07).toFixed(2)
                    : values.rf_total}
                </div>
              </label>

              <hr />

              <label className="label">
                <label className="label cursor-pointer">
                  <span className="">หักภาษี ณ ที่จ่าย</span>
                  <select
                    value={values.rf_tax}
                    onChange={(e) => {
                      const percentTax = parseInt(e.target.value);
                      setValues({ ...values, rf_tax: percentTax });
                    }}
                  >
                    <option value="0">0%</option>
                    <option value="1">1%</option>
                    <option value="3">3%</option>
                  </select>
                </label>
                <div>
                  {values.rf_tax
                    ? ((values.rf_tax / 100) * values.rf_total).toFixed(2)
                    : ""}
                </div>
              </label>

              {values.rf_tax ? (
                <label className="label">
                  <span className="">ยอดชำระ</span>
                  <div>
                    {(values.rf_total * (1.07 - values.rf_tax / 100)).toFixed(
                      2
                    )}
                  </div>
                </label>
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

export default I_receiptcash;
