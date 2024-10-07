import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";
import useAuth from "../../hooks/useAuth";
import addListIndex from "../../utils/addListIndex";
import ProductModel from "../component/ProductModel";
function I_bill() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  const employee_fullname =
    localStorage.getItem("employee_fname") +
    " " +
    localStorage.getItem("employee_lname");
  const [QuotationEmployee, setEmployee] = useState("");
  const [values, setValues] = useState({
    bill_date: moment(new Date()).format("YYYY-MM-DD"),
    bill_dateend: moment(new Date()).format("YYYY-MM-DD"),
    bill_credit: 0,
    disc_cash: (0).toFixed(2),
    disc_percent: "",
    bill_total: 0, //รวมเป็นเงินเท่าไหร่
    bill_detail: "",
    bill_vat: true,
    bill_tax: 0,
    bill_status: "รออนุมัติ",
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

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const quotation = searchParams.get("quotation");
  const version = searchParams.get("version");

  const validationSchema = Yup.object({
    bill_credit: Yup.number()
      .required("โปรดจำนวนวันเครดิต")
      .min(0, "จำนวนวันเคดิตไม่สามารถติดลบได้")
      .typeError("โปรดใส่เครดิตเป็นตัวเลข"),
    customer_id: Yup.string().required("โปรดเลือกลูกค้า"),
    bill_date: Yup.date()
      .max(new Date(), "ไม่สามาถาใส่วันที่เกินวันปัจจุบัน")
      .required("โปรดเลือกวันที่ออกใบวางบิล"),
    disc_cash: Yup.number()
      .required("โปรดใส่จำนวนเงินส่วนลด")
      .typeError("โปรดใส่จำนวนเงินเป็นตัวเลข")
      .test(
        "disc_cash",
        "ส่วนลดไม่สามารถมากกว่าราคาสินค้าทั้งหมด",
        function (value) {
          const { bill_total } = this.parent;
          const IntValue = parseFloat(value);
          return IntValue < parseFloat(bill_total) + IntValue;
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

  // ดึงข้อมูล ใบเสนอราคา
  const fetchQuotation = async () => {
    try {
      const response = await axios.get(
        `/getquotation/${quotation}?version=${version}`
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
          listb_number: listq_number,
          listb_price: listq_price,
          listb_amount: listq_amount,
          listb_total: listq_total,
        })
      );
      setEmployee(response.data.employee_name);
      setValues({
        ...values,
        bill_total: quotationDetail.quotation_total, //รวมเป็นเงินเท่าไหร่
        bill_detail: quotationDetail.quotation_detail,
        bill_vat: quotationDetail.quotation_vat,
        bill_tax: quotationDetail.quotation_tax,
        disc_cash: quotationDetail.disc_cash,
        disc_percent: quotationDetail.disc_percent,
        bill_credit: quotationDetail.quotation_credit,
        bill_status: quotationDetail.quotation_status,
        bill_dateend: moment(new Date())
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
  ///////////////////////
  const fetchCustomerName = async (customer_id) => {
    try {
      const res = await axios.get("/getcustomers?sqlWhere=" + customer_id);
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
        bill_total: newTotal.toFixed(2),
      };
    });
  };

  //เกี่ยวกับวันที่เครดิต
  const handleCreditChange = (e) => {
    const creditDays = e.target.value;
    const newEndDate = moment(values.bill_date)
      .add(parseInt(creditDays), "days")
      .format("YYYY-MM-DD");
    setValues({
      ...values,
      bill_credit: creditDays,
      bill_dateend: newEndDate,
    });
  };
  const handleEndDateChange = (e) => {
    const endDate = moment(e.target.value);
    const startDate = moment(values.bill_date);
    const creditDays = endDate.diff(startDate, "days");
    setValues({
      ...values,
      bill_dateend: e.target.value,
      bill_credit: creditDays.toString(),
    });
  };
  const handleSearch = () => {
    fetchProduct();
  };
  useEffect(() => {
    if (quotation) {
      fetchQuotation();
    } else {
      fetchCustomer();
      setEmployee(employee_fullname);
    }
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    // ทำการรวมราคาสินค้าก่อนลดราคาใหม่
    const newTotalBeforeDisc = values.items
      .reduce((accumulator, currentItem) => {
        return accumulator + parseFloat(currentItem.listb_total);
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
      bill_total: (newTotalBeforeDisc - newDisc_cash).toFixed(2),
      disc_cash: newDisc_cash.toFixed(2),
    }));
  }, [values.items, values.disc_percent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let updatedRequestValues = addListIndex(values, "listb_number");
      await validationSchema.validate(updatedRequestValues, {
        abortEarly: false,
      });
      // ตรวจสอบว่า `quotation` มีค่าอยู่หรือไม่ ถ้ามีก็เพิ่มเข้าไปใน `updatedValues`
      if (quotation) {
        updatedRequestValues = {
          ...updatedRequestValues,
          quotation_id: quotation,
          version: version,
        };
      }
      await handleInsert(updatedRequestValues);
      setErrors({});
      // navigate("/bill");
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
      const response = await axios.post("/bill/insert", updatedValues);
      console.log("Success:", response.data);
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
      toast.error("Error during bill insertion", {
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
        list={["listb_total", "listb_amount"]}
      />
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">สร้างใบวางบิล</h1>
        <hr className="my-4" />
        <div className="flex items-center ">
          <form
            onSubmit={handleSubmit}
            className="mx-auto min-w-96 xl:w-full xl:max-w-4xl"
          >
            <div className="mt-5 mb-2 xl:flex justify-between">
              <div className="form-control w-25 ">
                <label className="label">
                  <span>ชื่อลูกค้า</span>
                </label>

                <select
                  className="select select-bordered  "
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
                  <span>ข้อมูลลูกค้า</span>
                </label>
                <div className="rounded-[12px] border px-3 py-1">
                  {" "}
                  <label className="label">
                    <span>
                      {" "}
                      {selectCustomerDetail.data.customer_address
                        ? "รายละเอียดที่อยู่ : " +
                          selectCustomerDetail.data.customer_address
                        : "รายละเอียดที่อยู่ : ไม่มี"}
                    </span>
                  </label>
                  <label className="label">
                    <span>
                      {" "}
                      {selectCustomerDetail.data.le_tax
                        ? "เลขประจำตัวผู้เสียภาษี : " +
                          selectCustomerDetail.data.le_tax
                        : "เลขประจำตัวผู้เสียภาษี : ไม่มี"}
                    </span>
                  </label>
                  <label className="label">
                    <span>
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
                    <span>จำนวนเงินรวมทั้งสิ้น</span>
                  </label>
                  <input
                    type="text"
                    value={
                      values.bill_vat
                        ? (values.bill_total * 1.07).toFixed(2)
                        : values.bill_total
                    }
                    className="input text-2xl"
                    readOnly
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span>วันที่:</span>
                  </label>
                  <input
                    type="date"
                    value={values.bill_date}
                    onChange={(e) => {
                      setValues({
                        ...values,
                        bill_date: e.target.value,
                        bill_dateend: moment(e.target.value)
                          .add(values.bill_credit, "days")
                          .format("YYYY-MM-DD"),
                      });
                    }}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                {errors.bill_date && (
                  <span className="text-error flex justify-end">
                    {errors.bill_date}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span>เครดิต (วัน):</span>
                  </label>
                  <input
                    type="text"
                    value={values.bill_credit}
                    className="input input-bordered w-1/2"
                    onChange={handleCreditChange}
                  />
                </div>
                {errors.bill_credit && (
                  <span className="text-error flex justify-end">
                    {errors.bill_credit}
                  </span>
                )}
                <div className="flex justify-between">
                  <label className="label">
                    <span>ครบกำหนด:</span>
                  </label>
                  <input
                    type="date"
                    value={values.bill_dateend}
                    onChange={handleEndDateChange}
                    className="input input-bordered w-1/2 "
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span>พนักงานขาย:</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={QuotationEmployee}
                    className="input input-bordered w-1/2"
                  />
                </div>
              </div>
            </div>
            <hr />
            <div className="flex my-2">
              <label className="label">
                <span>รายละเอียด:</span>
              </label>
              <input
                type="text"
                value={values.bill_detail}
                className="input input-bordered flex-1"
                onChange={(e) => {
                  setValues({ ...values, bill_detail: e.target.value });
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
                        disabled={quotation ? true : false}
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

                            setValues({
                              ...values,
                              items: updatedItems,
                            });
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
                    {!quotation && (
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
                {!quotation && (
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
                )}
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
                    disabled={quotation ? true : false}
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
                        bill_total: (totalBeforeDisc - handleDisc).toFixed(2),
                      });
                    }}
                  />
                  <span>%</span>
                </div>
                <div className="w-1/2">
                  <input
                    type="text"
                    disabled={quotation ? true : false}
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
                          bill_total: (totalBeforeDisc - handleDisc).toFixed(2),
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
                <span>ราคาหลังหักส่วนลด</span>
                <div>{values.bill_total}</div>
              </label>
              {errors.disc_cash && (
                <span className="text-error flex justify-end">
                  {errors.disc_cash}
                </span>
              )}
              <label className="label">
                <label className="label cursor-pointer">
                  <input
                    disabled={quotation ? true : false}
                    type="checkbox"
                    checked={values.bill_vat}
                    className="checkbox mr-2"
                    onChange={() =>
                      setValues({
                        ...values,
                        bill_vat: !values.bill_vat,
                      })
                    }
                  />
                  <span>ภาษีมูลค่าเพิ่ม 7%</span>
                </label>
                <div>
                  {values.bill_vat ? (values.bill_total * 0.07).toFixed(2) : ""}
                </div>
              </label>
              <label className="label">
                <span>จำนวนเงินรวมทั้งสิ้น</span>
                <div>
                  {values.bill_vat
                    ? (values.bill_total * 1.07).toFixed(2)
                    : values.bill_total}
                </div>
              </label>
              <hr />
              <label className="label">
                <label className="label cursor-pointer">
                  <span>หักภาษี ณ ที่จ่าย</span>
                  <select
                    value={values.bill_tax}
                    disabled={quotation ? true : false}
                    onChange={(e) => {
                      const percentTax = parseInt(e.target.value);
                      setValues({ ...values, bill_tax: percentTax });
                    }}
                  >
                    <option value="0">0%</option>
                    <option value="1">1%</option>
                    <option value="3">3%</option>
                  </select>
                </label>
                <div>
                  {values.bill_tax
                    ? ((values.bill_tax / 100) * values.bill_total).toFixed(2)
                    : ""}
                </div>
              </label>

              {values.bill_tax ? (
                <label className="label">
                  <span>ยอดชำระ</span>
                  <div>
                    {(
                      values.bill_total *
                      (1.07 - values.bill_tax / 100)
                    ).toFixed(2)}
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

export default I_bill;
