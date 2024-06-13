import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as Yup from "yup";
import moment from "moment";

function Stock() {
  const [lot, setLot] = useState([]);
  const { id } = useParams();
  const [values, setValues] = useState({
    lot_price: 0,
    lot_amount: 0,
    lot_date: new Date(),
    lot_has_exp: "",
    lot_exp: new Date(),
    product_id: id,
  });
  const [errors, setErrors] = useState({});
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const totalPages = Math.ceil(totalRows / perPage);

  const validationSchema = Yup.object({
    // เพิ่ม validationSchema ต่อไปตามต้องการ
  });
  const fetchlots = async () => {
    let url = `http://localhost:3001/stock?id=${id}&page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setLot(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching lots:", error);
    }
  };

  const handleSearch = () => {
    fetchlots();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  const handleSubmit = async (e) => {
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
        "http://localhost:3001/stock/insert",
        values
      );
      console.log("Success:", response.data);
      toast.success("Employee inserted successfully", {
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
      console.error("Error during employee insertion:", error);
      toast.error("Error during employee insertion", {
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
    fetchlots();
  }, [currentPage, perPage]);
  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ล็อตสินค้า {id}</h1>
          <div className="flex justify-between items-center mb-5">
            <button
              className="btn"
              onClick={() => document.getElementById("addLotModal").showModal()}
            >
              เพิ่มล็อต
            </button>
            <dialog id="addLotModal" className="modal">
              <div className="modal-box">
                <button
                  className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                  onClick={() => document.getElementById("addLotModal").close()}
                >
                  ✕
                </button>
                <h3 className="font-bold text-lg">เพิ่มล็อตสินค้า</h3>
                <form onSubmit={handleSubmit}>
                  <div className="mt-4">
                    <label className="block mb-2 font-medium">ราคาทุน</label>
                    <input
                      type="text"
                      placeholder=""
                      name="lot_price"
                      className="input input-bordered w-full mb-1"
                      value={values.lot_price}
                      onChange={(e) =>
                        setValues({ ...values, lot_price: e.target.value })
                      }
                    />
                    {errors.lot_price && (
                      <span className="text-error">{errors.lot_price}</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block mb-2 font-medium">
                      จำนวนสินค้า
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      name="lot_amount"
                      className="input input-bordered w-full mb-1"
                      value={values.lot_amount}
                      onChange={(e) =>
                        setValues({ ...values, lot_amount: e.target.value })
                      }
                    />
                    {errors.lot_amount && (
                      <span className="text-error">{errors.lot_amount}</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block mb-2 text-sm font-medium">
                      วันที่นำเข้าล็อต
                    </label>
                    <input
                      type="date"
                      name="lot_date"
                      className="input input-bordered w-full mb-1"
                      value={values.lot_date}
                      onChange={(e) =>
                        setValues({ ...values, lot_date: e.target.value })
                      }
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block mb-2 text-sm font-medium">
                      วันที่หมดอายุ
                    </label>
                    <input
                      type="date"
                      name="lot_exp"
                      className="input input-bordered w-full mb-1"
                      value={values.lot_exp}
                      onChange={(e) =>
                        setValues({ ...values, lot_exp: e.target.value })
                      }
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary mt-4"
                    onClick={() =>
                      document.getElementById("addLotModal").close()
                    }
                  >
                    เพิ่มล็อต
                  </button>
                </form>
              </div>
            </dialog>

            <div className="flex">
              {" "}
              <label className="input input-bordered flex items-center gap-2">
                <input
                  type="text"
                  className="grow bg-base-100"
                  placeholder="ค้นหา"
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
              <button className="btn btn-primary" onClick={handleSearch}>
                ค้นหา
              </button>
            </div>
          </div>
          <table className="table text-base">
            <thead>
              <tr className=" text-base">
                <th>รหัสล็อต</th>
                <th>ราคาทุน</th>
                <th>จำวนทั้งหมด</th>
                <th>คงเหลือ</th>
                <th>วันที่เพิ่มล็อต</th>
                <th>วันที่หมดอายุ</th>
              </tr>
            </thead>
            <tbody>
              {lot && lot.length !== 0 ? (
                lot.map((lot) => (
                  <tr key={lot.lot_number}>
                    <td>{lot.lot_number}</td>
                    <td>{lot.lot_price}</td>
                    <td>{lot.lot_total}</td>
                    <td>{lot.lot_amount}</td>
                    <td>{moment(lot.lot_date).format("YYYY-MM-DD")}</td>
                    <td>{}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="flex justify-between mt-4">
            <select
              value={perPage}
              onChange={(e) => handlePerRowsChange(Number(e.target.value))}
              className="select select-primary"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="30">30</option>
              {/* Add more options if needed */}
            </select>
            {lot && lot.length !== 0 ? (
              <div className="flex justify-between items-center">
                <span className="mr-5">
                  {`Showing ${(currentPage - 1) * perPage + 1}-${Math.min(
                    currentPage * perPage,
                    totalRows
                  )} of ${totalRows}`}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ArrowBigLeft size={20} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ArrowBigRight size={20} />
                </button>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </div>
      <ToastContainer lot="top-right" />
    </>
  );
}

export default Stock;
