import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";
import { useParams, useNavigate } from "react-router-dom";
import addListIndex from "../../utils/addListIndex";

function E_receiptcash() {
  const axios = useAxiosPrivate();
  const { id } = useParams();
  const [search, setSearch] = useState("");
  const [lotNumbers, setLotNumbers] = useState([]);
  const [productDetail, setProductdetail] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState([]);
  const [originalValues, setOriginalValues] = useState(null);
  const [values, setValues] = useState({
    rf_date: moment(new Date()).format("YYYY-MM-DD"),
    disc_cash: (0).toFixed(2),
    disc_percent: "",
    rf_total: 0, //รวมเป็นเงินเท่าไหร่
    rf_detail: "",
    rf_vat: true,
    rf_tax: 0,
    employee_id: "",
    customer_id: "",
    items: [],
  });
  const [totalBeforeDisc, setTotalBeforeDisc] = useState(0);
  const [receiptCashEmployee, setEmployee] = useState("");
  const [selectcustomer, setSelectCustomer] = useState([]);
  const [selectCustomerDetail, setSelectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });
  const [errors, setErrors] = useState({});
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

  //ตรวจสอบถ้าไม่มีการเปลี่ยนแปลงของข้อมูล
  const isDataChanged = () => {
    if (!originalValues) return false;

    // เปรียบเทียบค่าที่สำคัญ
    const keysToCompare = [
      "rf_date",
      "rf_total",
      "rf_detail",
      "rf_vat",
      "rf_tax",
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
        currentItem.listrf_amount !== originalItem.listrf_amount ||
        currentItem.lot_number !== originalItem.lot_number
      ) {
        return true;
      }
    }

    return false;
  };
  const fetchReceiptCashs = async () => {
    try {
      const response = await axios.get(`/getreceiptcash/${id}`);
      const receiptCashDetail = response.data.rfDetail[0];
      const receiptCashList = response.data.listrf_Detail;
      const productDetail = response.data.productDetail;

      receiptCashList.forEach((list) => {
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
        rf_date: moment(receiptCashDetail.rf_date).format("YYYY-MM-DD"),
        rf_total: parseFloat(receiptCashDetail.rf_total), //รวมเป็นเงินเท่าไหร่
        rf_detail: receiptCashDetail.rf_detail,
        rf_vat: receiptCashDetail.rf_vat,
        rf_tax: receiptCashDetail.rf_tax,
        employee_id: receiptCashDetail.employee_id,
        customer_id: receiptCashDetail.customer_id
          ? receiptCashDetail.customer_id
          : "",
        items: receiptCashList || [],
        disc_cash: receiptCashDetail.disc_cash,
        disc_percent: receiptCashDetail.disc_percent,
      });
      setOriginalValues({
        rf_date: moment(receiptCashDetail.rf_date).format("YYYY-MM-DD"),
        rf_total: parseFloat(receiptCashDetail.rf_total), //รวมเป็นเงินเท่าไหร่
        rf_detail: receiptCashDetail.rf_detail,
        rf_vat: receiptCashDetail.rf_vat,
        rf_tax: receiptCashDetail.rf_tax,
        employee_id: receiptCashDetail.employee_id,
        customer_id: receiptCashDetail.customer_id
          ? receiptCashDetail.customer_id
          : "",
        items: receiptCashList || [],
        disc_cash: receiptCashDetail.disc_cash,
        disc_percent: receiptCashDetail.disc_percent,
      });
      if (receiptCashDetail.customer_id) {
        fetchCustomerDetail(receiptCashDetail.customer_id);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  // fetch lot ของสินค้า
  const fetchLotNumbers = async (productID) => {
    try {
      const response = await axios.get(`/selectstock/${productID}`);
      setLotNumbers(response.data);
    } catch (error) {
      console.error("Error fetching lot numbers:", error);
    }
  };

  /// fetch product ตอนเปิดหน้าเว็บ
  const fetchProduct = async () => {
    let url = `/getproduct/all`;
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
  //เมื่อเลือกสินค้า
  const handleSelectProduct = async (product) => {
    try {
      const newItem = {
        product_id: product.product_id,
        product_name: product.product_name,
        product_price: product.product_price,
        product_img: product.product_img,
        unit_name: product.unit_name,
        listrf_total: product.product_price,
        listrf_amount: 1,
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

  const handleSearch = () => {
    fetchProduct();
  };
  useEffect(() => {
    fetchCustomer();
    fetchReceiptCashs();
  }, []);

  useEffect(() => {
    console.log(values, " log from values");
  }, [values]);

  useEffect(() => {
    const newTotalBeforeDisc = values.items
      .reduce((accumulator, currentItem) => {
        return accumulator + parseInt(currentItem.listrf_total);
      }, 0)
      .toFixed(2);
    setTotalBeforeDisc(newTotalBeforeDisc);
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
      const updatedRequestValues = addListIndex(values, "listrf_number");
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
      const response = await axios.put(
        "/receiptcash/edit/" + id,
        updatedValues
      );
      console.log("Success:", response.data);
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
      <div className="rounded-box bg-base-100 p-5">
        <h1 className="ml-16 text-2xl">แก้ไขใบเสร็จรับเงิน(สด)</h1>
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
                          <div className="avatar p-2">
                            <img
                              src={`http://localhost:3001/img/product/${product.product_img}`}
                              alt={product.product_name}
                              className="w-20 h-20"
                            />
                          </div>
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
          <form
            onSubmit={handleSubmit}
            className="mx-auto min-w-96 xl:w-full xl:max-w-4xl"
          >
            <div className="mt-5 mb-2 xl:flex justify-between">
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
                        ? (values.rf_total * 1.07).toFixed(2)
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
                    value={receiptCashEmployee}
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
                      <div className="avatar">
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
                        rf_total: (totalBeforeDisc - handleDisc).toFixed(2),
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

export default E_receiptcash;
