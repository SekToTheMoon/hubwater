import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import moment from "moment";
import { useParams } from "react-router-dom";

function View_invoice() {
  const axios = useAxiosPrivate();
  const { id } = useParams();
  const [values, setValues] = useState({
    iv_date: moment(new Date()).format("YYYY-MM-DD"),
    iv_credit: 0,
    disc_cash: (0).toFixed(2),
    disc_percent: "",
    iv_total: 0, //รวมเป็นเงินเท่าไหร่
    iv_detail: "",
    iv_vat: true,
    iv_tax: 0,
    employee_id: "",
    customer_id: "",
    customer_name: "",
    items: [],
    iv_dateend: moment(new Date()).format("YYYY-MM-DD"),
  });

  const [invoiceEmployee, setEmployee] = useState("");
  const [selectCustomerDetail, setselectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });

  // ดึงข้อมูล ใบเสนอราคา
  const fetchinvoice = async () => {
    try {
      const response = await axios.get(`/getinvoice/${id}`);
      const invoiceDetail = response.data.ivDetail[0];
      const invoiceList = response.data.listiDetail;
      const productDetail = response.data.productDetail;

      invoiceList.forEach((list) => {
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
        iv_date: moment(invoiceDetail.iv_date).format("YYYY-MM-DD"),
        iv_credit: invoiceDetail.iv_credit,
        iv_total: parseFloat(invoiceDetail.iv_total), //รวมเป็นเงินเท่าไหร่
        iv_detail: invoiceDetail.iv_detail,
        iv_vat: invoiceDetail.iv_vat,
        iv_tax: invoiceDetail.iv_tax,
        employee_id: invoiceDetail.employee_id,
        customer_id: invoiceDetail.customer_id,
        items: invoiceList || [],
        iv_dateend: moment(invoiceDetail.iv_dateend).format("YYYY-MM-DD"),
        disc_cash: invoiceDetail.disc_cash,
        disc_percent: invoiceDetail.disc_percent,
      });
      fetchCustomerDetail(invoiceDetail.customer_id);
    } catch (error) {
      console.error("Error fetching product:", error);
    }
  };

  const fetchCustomerDetail = async (customer_id) => {
    try {
      const res = await axios.get("/getcustomer/" + customer_id);
      setselectCustomerDetail({
        data: res.data.data[0],
        zip_code: res.data.zip_code[0].zip_code,
      });
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchinvoice();
  }, []);

  return (
    <>
      <div className="rounded-box bg-base-100 p-5 min-h-full">
        <h1 className="ml-32 text-2xl text-slate-500">ใบแจ้งหนี้</h1>
        <hr className="my-4" />
        <div className="flex items-center">
          <div className="mx-auto w-2/3 pr-20 2xl:max-w-5xl ">
            <div className="flex justify-end mt-3">
              <button
                className="btn btn-info text-base-100"
                onClick={() => {
                  axios.get(`/pdf?id=${id}`);
                }}
              >
                print / download
              </button>
            </div>
            <div className="mt-5 mb-2 2xl:flex justify-between">
              <div className="form-control w-25">
                <label className="label">
                  <span className="">ชื่อลูกค้า</span>
                </label>
                <div className="input input-bordered flex items-center">
                  {selectCustomerDetail.data.customer_fname +
                    " " +
                    selectCustomerDetail.data.customer_lname}
                </div>
                <label className="label mt-3">
                  <span className="">ข้อมูลลูกค้า</span>
                </label>
                <div className="textarea textarea-bordered px-3 py-1">
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
                      values.iv_vat
                        ? (values.iv_total * 1.07).toFixed(0)
                        : values.iv_total
                    }
                    className="input text-3xl"
                    readOnly
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">วันที่:</span>
                  </label>
                  <input
                    type="date"
                    value={values.iv_date}
                    className="input input-bordered w-1/2 "
                    readOnly
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">เครดิต (วัน):</span>
                  </label>
                  <input
                    type="text"
                    value={values.iv_credit}
                    className="input input-bordered w-1/2"
                    readOnly
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">ครบกำหนด:</span>
                  </label>
                  <input
                    type="date"
                    value={values.iv_dateend}
                    className="input input-bordered w-1/2 "
                    readOnly
                  />
                </div>
                <div className="flex justify-between">
                  <label className="label">
                    <span className="">พนักงานขาย:</span>
                  </label>
                  <input
                    readOnly
                    type="text"
                    value={invoiceEmployee}
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
                value={values.iv_detail}
                readOnly
              />
            </div>
            {/* ตาราง */}
            <table className="w-full mt-3">
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
                    <td>{item.listi_amount}</td>
                    <td className="hidden sm:table-cell">{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listi_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
            <div className="ml-auto w-full  md:w-10/12 md:max-w-72 lg:w-6/12 xl:w-5/12">
              <label className="label ">
                <span className="my-auto">รวมเป็นเงิน</span>
                <div className="w1/2">
                  {" "}
                  {(
                    parseFloat(values.iv_total) + parseFloat(values.disc_cash)
                  ).toFixed(2)}
                </div>
              </label>
              <label className="label ">
                <div>
                  <span className="my-auto">ส่วนลด</span>

                  <span className="ml-1 max-w-8 text-center">
                    {values.disc_percent ? values.disc_percent : ""} %
                  </span>
                </div>
                <div className="w1/2 ">
                  <span className="text-right"> {values.disc_cash}</span>
                </div>
              </label>
              <label className="label">
                <span className="">ราคาหลังหักส่วนลด</span>
                <div className="w1/2">{values.iv_total}</div>
              </label>

              <label className="label">
                <label className="label cursor-pointer">
                  <input
                    disabled={true}
                    type="checkbox"
                    checked={values.iv_vat}
                    className="checkbox mr-2"
                    value={values.iv_vat}
                  />
                  <span>ภาษีมูลค่าเพิ่ม 7%</span>
                </label>
                <div className="w1/2 ">
                  {values.iv_vat ? (values.iv_total * 0.07).toFixed(2) : ""}
                </div>
              </label>

              <label className="label">
                <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                <div className="w1/2">
                  {values.iv_vat
                    ? (values.iv_total * 1.07).toFixed(2)
                    : values.iv_total}
                </div>
              </label>

              <hr />

              <label className="label">
                <label className="label cursor-pointer">
                  <span className="">หักภาษี ณ ที่จ่าย</span>
                  <select value={values.iv_tax} disabled={true}>
                    <option value="0">0%</option>
                    <option value="1">1%</option>
                    <option value="3">3%</option>
                  </select>
                </label>
                <div className="w1/2">
                  {values.iv_tax
                    ? ((values.iv_tax / 100) * values.iv_total).toFixed(2)
                    : ""}
                </div>
              </label>

              {values.iv_tax ? (
                <label className="label">
                  <span className="">ยอดชำระ</span>
                  <div className="w1/2">
                    {(values.iv_total * (1.07 - values.iv_tax / 100)).toFixed(
                      2
                    )}
                  </div>
                </label>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default View_invoice;
