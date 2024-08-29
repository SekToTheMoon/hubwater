import React, { useEffect, useState } from "react";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import moment from "moment";
import { useParams } from "react-router-dom";

function View_out() {
  const axios = useAxiosPrivate();
  const { id } = useParams();
  const employee_fullname =
    localStorage.getItem("employee_fname") +
    " " +
    localStorage.getItem("employee_lname");

  const [values, setValues] = useState({
    out_date: moment(new Date()).format("YYYY-MM-DD"),
    out_total: 0,
    out_detail: "",
    employee_id: "",
    items: [],
    OldImage: null,
  });

  const [ExpenseType, setExpenseType] = useState([]);
  const [imageURL, setImageURL] = useState(null);

  const fetchOut = async () => {
    let url = `/getout/${id}`;
    try {
      const response = await axios.get(url);
      const outData = response.data.outData;
      const outList = response.data.listData;
      const imgs = response.data.imagesData;
      setValues({
        out_date: moment(outData.out_date).format("YYYY-MM-DD"),
        out_total: outData.out_total,
        out_detail: outData.out_detail,
        employee_id: outData.employee_id,
        items: outList,
        OldImage: imgs,
      });
      let showImage = [];
      imgs.map((j) => {
        showImage.push(`http://localhost:3001/img/expense/${j.outimg}`);
      });
      setImageURL(showImage);
    } catch (error) {
      console.error("Error fetching expense types:", error);
    }
  };
  const fetchExpense = async () => {
    let url = `/getexpensetype/all`;
    try {
      const res = await axios.get(url);
      setExpenseType(res.data);
    } catch (error) {
      console.error("Error fetching expense types:", error);
    }
  };

  useEffect(() => {
    fetchExpense();
    fetchOut();
  }, []);

  return (
    <>
      <div className="rounded-box bg-base-100 p-5 min-h-full">
        <h1 className="ml-16 text-2xl">ดูเอกสารค่าใช้จ่าย</h1>
        <hr className="my-4" />
        <div className="mx-auto w-2/3 2xl:max-w-5xl">
          <div className="mt-5 mb-2 2xl:flex justify-between">
            <div className="form-control w-25">
              <label className="label">
                <span className="">พนักงาน</span>
              </label>
              <div className="input input-bordered flex items-center">
                {employee_fullname}
              </div>
            </div>
            <div className="w-1/3">
              <div className="form-control ">
                <label className="label">
                  <span className="">จำนวนเงินรวมทั้งสิ้น</span>
                </label>
                <input
                  readOnly
                  type="text"
                  className="input text-3xl"
                  value={values.out_total}
                />
              </div>
              <div className="flex justify-between">
                <label className="label">
                  <span className="">วันที่:</span>
                </label>
                <input
                  type="date"
                  value={values.out_date}
                  readOnly
                  className="input input-bordered w-1/2"
                />
              </div>
            </div>
          </div>

          {imageURL && (
            <div className={`grid grid-cols-${imageURL.length}`}>
              {imageURL.map((url, index) => (
                <div
                  className="w-100 flex justify-center h-40 bg-base-200"
                  key={index}
                >
                  <img className="w-100" src={url} alt="uploaded" />
                </div>
              ))}
            </div>
          )}
          <hr />
          <div className="flex mt-2">
            <label className="label">
              <span className="">รายละเอียด:</span>
            </label>
            <input
              type="text"
              value={values.out_detail}
              className="input input-bordered flex-1"
              readOnly
            />
          </div>
          {/* ตาราง */}
          <table className="w-full mt-2">
            <thead className="bg-base-200 text-left">
              <tr className="border-b text-center ">
                <th className="py-3">ลำดับ</th>
                <th>ชื่อสินค้า</th>
                <th>ราคาต่อหน่วย</th>
                <th>จำนวนสินค้า</th>
                <th>ราคารวม</th>
                <th>ประเภทค่าใช้จ่าย</th>
              </tr>
            </thead>
            <tbody>
              {values.items.map((item, index) => (
                <tr key={index} className="text-center">
                  <td>{index + 1}</td>
                  <td>{item.listo_name}</td>
                  <td>{item.listo_price}</td>
                  <td>{item.listo_amount}</td>
                  <td>{item.listo_total}</td>
                  <td>{item.expensetype_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <hr />
          <div className="ml-auto w-5/12">
            <div>
              <label className="label ">
                <span className="my-auto">รวมเป็นเงิน</span>
                <div className="w1/2">{values.out_total}</div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default View_out;
