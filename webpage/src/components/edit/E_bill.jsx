import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";
import { useNavigate, useParams } from "react-router-dom";
import addListIndex from "../../utils/addListIndex";
import ProductModel from "../component/ProductModel";
function E_bill() {
  const axios = useAxiosPrivate();

  const { id } = useParams();

  const [originalValues, setOriginalValues] = useState(null);
  const [values, setValues] = useState({
    bn_date: moment(new Date()).format("YYYY-MM-DD"),
    bn_dateend: moment(new Date()).format("YYYY-MM-DD"),
    bn_credit: 0,
    disc_cash: (0).toFixed(2),
    disc_percent: "",
    bn_total: 0, //รวมเป็นเงินเท่าไหร่
    bn_detail: "",
    bn_vat: true,
    bn_tax: 0,
    employee_id: "",
    customer_id: "",
    items: [],
  });
  const [totalBeforeDisc, setTotalBeforeDisc] = useState(0);
  const [errors, setErrors] = useState({});
  const [billEmployee, setEmployee] = useState("");
  const [selectCustomer, setSelectCustomer] = useState([]);
  const [selectCustomerDetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const validationSchema = Yup.object({
    bn_credit: Yup.number()
      .required("โปรดจำนวนวันเครดิต")
      .min(0, "จำนวนวันเคดิตไม่สามารถติดลบได้")
      .typeError("โปรดใส่เครดิตเป็นตัวเลข"),
    customer_id: Yup.string().required("โปรดเลือกลูกค้า"),
    bn_date: Yup.date()
      .max(new Date(), "ไม่สามาถาใส่วันที่เกินวันปัจจุบัน")
      .required("โปรดเลือกวันที่ออกใบวางบิล"),
    disc_cash: Yup.number()
      .required("โปรดใส่จำนวนเงินส่วนลด")
      .typeError("โปรดใส่จำนวนเงินเป็นตัวเลข")
      .test(
        "disc_cash",
        "ส่วนลดไม่สามารถมากกว่าราคาสินค้าทั้งหมด",
        function (value) {
          const { bn_total } = this.parent;
          return value < bn_total + value;
        }
      ),
    items: Yup.array()
      .of(
        Yup.object().shape({
          product_id: Yup.string().required("โปรดเลือกสินค้า"),
          listb_amount: Yup.number()
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

  //ตรวจสอบถ้าไม่มีการเปลี่ยนแปลงของข้อมูล
  const isDataChanged = () => {
    if (!originalValues) return false;

    // เปรียบเทียบค่าที่สำคัญ
    const keysToCompare = [
      "bn_date",
      "bn_credit",
      "bn_total",
      "bn_detail",
      "bn_vat",
      "bn_tax",
      "customer_id",
      "bn_dateend",
      "disc_cash",
    ];

    for (let key of keysToCompare) {
      if (values[key] !== originalValues[key]) return true;
    }

    // เปรียบเทียบ items
    if (values.items.length !== originalValues.items.length) return true;

    for (let i = 0; i < values.items.length; i++) {
      const currentItem = values.items[i];
      const originalItem = originalValues.items[i];

      if (
        currentItem.product_id !== originalItem.product_id ||
        currentItem.listb_amount !== originalItem.listb_amount ||
        currentItem.lot_number !== originalItem.lot_number
      ) {
        return true;
      }
    }

    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({ ...values, [name]: value });
  };
  // ดึงข้อมูล ใบวางบิล
  const fetchBill = async () => {
    try {
      const response = await axios.get(`/getbill/${id}`);
      const bnDetail = response.data.bnDetail[0];
      const billList = response.data.listbDetail;
      const productDetail = response.data.productDetail;

      billList.forEach((list) => {
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
        bn_date: moment(bnDetail.bn_date).format("YYYY-MM-DD"),
        bn_credit: bnDetail.bn_credit,
        bn_total: parseFloat(bnDetail.bn_total), //รวมเป็นเงินเท่าไหร่
        bn_detail: bnDetail.bn_detail,
        bn_vat: bnDetail.bn_vat,
        bn_tax: bnDetail.bn_tax,
        bn_status: bnDetail.bn_status,
        employee_id: bnDetail.employee_id,
        customer_id: bnDetail.customer_id,
        items: billList || [],
        bn_dateend: moment(bnDetail.bn_dateend).format("YYYY-MM-DD"),
        disc_cash: bnDetail.disc_cash,
        disc_percent: bnDetail.disc_percent,
      });
      setOriginalValues({
        bn_date: moment(bnDetail.bn_date).format("YYYY-MM-DD"),
        bn_credit: bnDetail.bn_credit,
        bn_total: parseFloat(bnDetail.bn_total), //รวมเป็นเงินเท่าไหร่
        bn_detail: bnDetail.bn_detail,
        bn_vat: bnDetail.bn_vat,
        bn_tax: bnDetail.bn_tax,
        bn_status: bnDetail.bn_status,
        employee_id: bnDetail.employee_id,
        customer_id: bnDetail.customer_id,
        items: billList || [],
        bn_dateend: moment(bnDetail.bn_dateend).format("YYYY-MM-DD"),
        disc_cash: bnDetail.disc_cash,
        disc_percent: bnDetail.disc_percent,
      });
      fetchCustomerDetail(bnDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
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
  // ฟังก์ชันสำหรับลบรายการสินค้า
  const handleRemoveItem = (index) => {
    setValues((prevValues) => {
      const updatedItems = [...prevValues.items];
      updatedItems.splice(index, 1);
      const newTotal = updatedItems.reduce(
        (sum, item) => sum + parseFloat(item.listb_total),
        0
      );
      return {
        ...prevValues,
        items: updatedItems,
        bn_total: newTotal.toFixed(2),
      };
    });
  };

  ///////////////////////

  //เกี่ยวกับวันที่เครดิต
  const handleCreditChange = (e) => {
    const creditDays = e.target.value;
    const newEndDate = moment(values.bn_date)
      .add(parseInt(creditDays), "days")
      .format("YYYY-MM-DD");
    setValues({
      ...values,
      bn_credit: creditDays,
      bn_dateend: newEndDate,
    });
  };
  const handleEndDateChange = (e) => {
    const endDate = moment(e.target.value);
    const startDate = moment(values.bn_date);
    const creditDays = endDate.diff(startDate, "days");
    setValues({
      ...values,
      bn_dateend: e.target.value,
      bn_credit: creditDays.toString(),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!isDataChanged()) {
        toast.info("ไม่มีการเปลี่ยนแปลงข้อมูล", {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
        return;
      }
      const updatedRequestValues = addListIndex(values, "listb_number");

      await validationSchema.validate(updatedRequestValues, {
        abortEarly: false,
      });
      await handleEdit(updatedRequestValues);
      setErrors({});
    } catch (error) {
      console.log(error.inner);
      const newErrors = {};
      error?.inner?.forEach((err) => {
        console.log(err?.path);
        newErrors[err?.path] = err?.message;
      });
      setErrors(newErrors);
    }
  };
  const handleEdit = async (updatedValues) => {
    try {
      await axios.put("/bill/edit/" + id, updatedValues);
      toast.success("bill inserted successfully", {
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
      console.error("Error during bill insertion:", error);
      toast.error(error.response.data.msg, {
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
    fetchBill();
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    const newTotalBeforeDisc = values.items
      .reduce((accumulator, currentItem) => {
        return accumulator + parseInt(currentItem.listb_total);
      }, 0)
      .toFixed(2);
    setTotalBeforeDisc(newTotalBeforeDisc);
    let newDisc_cash = parseFloat(values.disc_cash);
    if (values.disc_percent && values.disc_percent > 0) {
      newDisc_cash = newTotalBeforeDisc * (values.disc_percent / 100);
    }

    setValues((prevValues) => ({
      ...prevValues,
      bn_total: (newTotalBeforeDisc - newDisc_cash).toFixed(2),
      disc_cash: newDisc_cash.toFixed(2),
    }));
  }, [values.items, values.disc_percent]);

  return (
    <>
      <ProductModel
        setValues={setValues}
        list={["listb_total", "listb_amount"]}
      />
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">แก้ไขใบวางบิล</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form
            onSubmit={handleSubmit}
            className="mx-auto w-full xl:w-full xl:max-w-4xl"
          >
            <div className="mt-5 w-full mb-2 xl:flex justify-between">
              <div className="form-control ">
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
                      values.bn_vat
                        ? (values.bn_total * 1.07).toFixed(2)
                        : values.bn_total
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
                    value={values.bn_date}
                    onChange={(e) => {
                      setValues({
                        ...values,
                        bn_date: e.target.value,
                        bn_dateend: moment(e.target.value)
                          .add(values.bn_credit, "days")
                          .format("YYYY-MM-DD"),
                      });
                    }}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                {errors.bn_date && (
                  <span className="text-error flex justify-end">
                    {errors.bn_date}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">เครดิต (วัน):</span>
                  </label>
                  <input
                    type="text"
                    value={values.bn_credit}
                    className="input input-bordered w-1/2"
                    onChange={handleCreditChange}
                  />
                </div>
                {errors.bn_credit && (
                  <span className="text-error flex justify-end">
                    {errors.bn_credit}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">ครบกำหนด:</span>
                  </label>
                  <input
                    type="date"
                    value={values.bn_dateend}
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
                    value={billEmployee}
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
                value={values.bn_detail}
                onChange={(e) => {
                  setValues({ ...values, bn_detail: e.target.value });
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
                        value={item.listb_amount || ""}
                        onChange={(e) => {
                          const newAmount = e.target.value;
                          const updatedItems = [...values.items];
                          if (newAmount === "" || Number(newAmount) > 0) {
                            updatedItems[index].listb_amount =
                              newAmount === "" ? "" : Number(newAmount);
                            updatedItems[index].listb_total =
                              (newAmount === "" ? 0 : Number(newAmount)) *
                              updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                        onBlur={() => {
                          const updatedItems = [...values.items];
                          if (
                            updatedItems[index].listb_amount === "" ||
                            updatedItems[index].listb_amount === 0
                          ) {
                            updatedItems[index].listb_amount = 1;
                            updatedItems[index].listb_total =
                              1 * updatedItems[index].product_price;
                            setValues({ ...values, items: updatedItems });
                          }
                        }}
                      />
                    </td>
                    <td className="hidden sm:table-cell">{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listb_total}</td>
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
            {errors.items && <span className="text-error">{errors.items}</span>}
            <hr />
            <div className="ml-auto w-full  md:w-10/12 md:max-w-72 lg:w-6/12 xl:w-5/12">
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
                        bn_total: (totalBeforeDisc - handleDisc).toFixed(2),
                      });
                    }}
                  />
                  <span>%</span>
                </div>
                <div className="w-1/2 ">
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
                          bn_total: (totalBeforeDisc - handleDisc).toFixed(2),
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
                <div>{values.bn_total}</div>
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
                    checked={values.bn_vat}
                    className="checkbox mr-2"
                    onChange={() =>
                      setValues({
                        ...values,
                        bn_vat: !values.bn_vat,
                      })
                    }
                  />
                  <span>ภาษีมูลค่าเพิ่ม 7%</span>
                </label>
                <div>
                  {values.bn_vat ? (values.bn_total * 0.07).toFixed(2) : ""}
                </div>
              </label>

              <label className="label">
                <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                <div>
                  {values.bn_vat
                    ? (values.bn_total * 1.07).toFixed(2)
                    : values.bn_total}
                </div>
              </label>

              <hr />

              <label className="label">
                <label className="label cursor-pointer">
                  <span className="">หักภาษี ณ ที่จ่าย</span>
                  <select
                    value={values.bn_tax}
                    onChange={(e) => {
                      const percentTax = parseInt(e.target.value);
                      setValues({ ...values, bn_tax: percentTax });
                    }}
                  >
                    <option value="0">0%</option>
                    <option value="1">1%</option>
                    <option value="3">3%</option>
                  </select>
                </label>
                <div>
                  {values.iv_tax
                    ? ((values.bn_tax / 100) * values.bn_total).toFixed(2)
                    : ""}
                </div>
              </label>

              {values.bn_tax ? (
                <label className="label">
                  <span className="">ยอดชำระ</span>
                  <div>
                    {(values.bn_total * (1.07 - values.bn_tax / 100)).toFixed(
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

export default E_bill;
