import React, { useState, useEffect } from "react";
import axios from "../../api/axios";
import moment from "moment";
import { useParams } from "react-router-dom";

function View_bill() {
  const { id } = useParams();
  const [values, setValues] = useState({
    bn_date: moment(new Date()).format("YYYY-MM-DD"),
    bn_credit: 0,
    bn_total: 0, //รวมเป็นเงินเท่าไหร่
    bn_detail: "",
    bn_vat: true,
    bn_tax: false,
    employee_id: "",
    customer_id: "",
    customer_name: "",
    items: [],
    bn_dateend: moment(new Date()).format("YYYY-MM-DD"),
  });
  const [billEmployee, setEmployee] = useState("");
  const [selectCustomerDetail, setselectCustomerDetail] = useState({
    data: [""],
    zip_code: "",
  });

  // ดึงข้อมูล ใบเสนอราคา
  const fetchbill = async () => {
    try {
      const response = await axios.get(`/getbill/${id}`);
      const billDetail = response.data.bnDetail[0];
      const billList = response.data.listbDetail;
      const productDetail = response.data.productDetail;
      console.log(billDetail);

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
        bn_date: moment(billDetail.bn_date).format("YYYY-MM-DD"),
        bn_credit: billDetail.bn_credit,
        bn_total: parseFloat(billDetail.bn_total), //รวมเป็นเงินเท่าไหร่
        bn_detail: billDetail.bn_detail,
        bn_vat: billDetail.bn_vat,
        bn_tax: billDetail.bn_tax,
        employee_id: billDetail.employee_id,
        customer_id: billDetail.customer_id,
        items: billList || [],
        bn_dateend: moment(billDetail.bn_dateend).format("YYYY-MM-DD"),
      });
      fetchCustomerDetail(billDetail.customer_id);
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
    fetchbill();
  }, []);

  return (
    <>
      <div className="rounded-box bg-base-100 p-5 min-h-full">
        <h1 className="ml-32 text-2xl text-slate-500">ใบวางบิล</h1>
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
            <div className=" mb-2 2xl:flex justify-between">
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
                      values.bn_vat
                        ? (values.bn_total * 1.07).toFixed(0)
                        : values.bn_total
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
                    value={values.bn_date}
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
                    value={values.bn_credit}
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
                    value={values.bn_dateend}
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
                readOnly
              />
            </div>
            {/* ตาราง */}
            <table className="w-full mt-3">
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
                    <td>{item.listb_amount}</td>
                    <td>{item.unit_name}</td>
                    <td>{item.product_price}</td>
                    <td>{item.listb_total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <hr />
            <div className="ml-auto w-5/12 mt-3">
              <div>
                <label className="label ">
                  <span className="my-auto">รวมเป็นเงิน</span>
                  <div className="w1/2">{values.bn_total}</div>
                </label>
              </div>
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      disabled={true}
                      type="checkbox"
                      checked={values.bn_vat}
                      className="checkbox mr-2"
                      value={values.bn_vat}
                    />
                    <span>ภาษีมูลค่าเพิ่ม 7%</span>
                  </label>
                  <div className="w1/2 ">
                    {values.bn_vat ? (values.bn_total * 0.07).toFixed(0) : ""}
                  </div>
                </label>
              </div>
              <div>
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                  <div className="w1/2">
                    {values.bn_vat
                      ? (values.bn_total * 1.07).toFixed(0)
                      : values.bn_total}
                  </div>
                </label>
              </div>
              <hr />
              <div>
                <label className="label">
                  <label className="label cursor-pointer">
                    <input
                      disabled={true}
                      type="checkbox"
                      checked={values.bn_tax}
                      className="checkbox mr-2"
                    />
                    <span className="">หักภาษี ณ ที่จ่าย 3%</span>
                  </label>
                  <div className="w1/2">
                    {values.bn_tax ? values.bn_total * 0.03 : ""}
                  </div>
                </label>
              </div>
              {values.bn_tax ? (
                <div>
                  <label className="label">
                    <span className="">ยอดชำระ</span>
                    <div className="w1/2">
                      {(
                        values.bn_total * 0.07 +
                        values.bn_total -
                        values.bn_total * 0.03
                      ).toFixed(0)}
                    </div>
                  </label>
                </div>
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

export default View_bill;
