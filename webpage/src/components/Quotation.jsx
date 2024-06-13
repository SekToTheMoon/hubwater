import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function Quotation() {
  const [Quotation, setQuotation] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [quotationForDel, setQuotationfordel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;
  const fetchQuotations = async () => {
    let url = `http://localhost:3001/Quotation?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setQuotation(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Quotations:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        "http://localhost:3001/Quotation/delete/" + id
      );
      setQuotationfordel(null);
      fetchQuotations();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          Quotation: "top-right",
          autoClose: 3000,
          hiQuotationrogressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
        });
      }
    } catch (error) {
      // Handle network errors or other issues
      console.error("Error during registration:", error);
      toast.error("Error during registration", {
        Quotation: "top-right",
        autoClose: 5000,
        hiQuotationrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchQuotations();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchQuotations();
    if (messageSuccess) {
      toast.success(messageSuccess, {
        Quotation: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      navigate("/all/Quotation");
    }
  }, [currentPage, perPage]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบเสนอราคา</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มใบเสนอราคา
            </Link>
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
          {quotationForDel && (
            <dialog open className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">ลบข้อมูลใบเสนอราคา</h3>
                <p className="py-4">
                  ต้องการลบข้อมูลใบเสนอราคา {quotationForDel.quotation_id}{" "}
                  หรือไม่
                </p>
                <div className="modal-action">
                  <form method="dialog">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleDelete(quotationForDel.quotation_id);
                        setQuotationfordel(null);
                      }}
                    >
                      ยืนยัน
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => setQuotationfordel(null)}
                    >
                      ยกเลิก
                    </button>
                  </form>
                </div>
              </div>
            </dialog>
          )}

          <table className="table text-base">
            <thead>
              <tr className=" text-base">
                <th>วันที่</th>
                <th>เลขเอกสาร</th>
                <th>ชื่อลูกค้า</th>
                <th>ยอดรวมสุทธิ</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Quotation && Quotation.length !== 0 ? (
                Quotation.map((quotation, index) => (
                  <tr key={quotation.quotation_id}>
                    <td>{quotation.quotation_date.substring(0, 10)}</td>
                    <td>{quotation.quotation_id}</td>
                    <td>{quotation.employee_fname}</td>
                    <td>{quotation.quotation_total}</td>
                    <td className="flex gap-2">
                      <select
                        value={quotation.quotation_status}
                        className="select select-bordered w-1/2 max-w-xs"
                        onChange={(e) =>
                          setQuotation((oldQuotation) => {
                            let newQuotation = [...oldQuotation];
                            newQuotation[index] = {
                              ...newQuotation[index],
                              quotation_status: e.target.value,
                            };
                            return newQuotation;
                          })
                        }
                      >
                        <option value={"รอดำเนินการ"}>รอดำเนินการ</option>
                        <option value={"สร้างใบวางบิล"}>สร้างใบวางบิล</option>
                        <option value={"สร้างใบแจ้งหนี้"}>
                          สร้างใบแจ้งหนี้
                        </option>
                        <option value={"ดำเนินการแล้ว"}>ดำเนินการแล้ว</option>
                        <option value={"อนุมัติ"}>อนุมัติ</option>
                      </select>
                      <div className="dropdown dropdown-hover ">
                        <div tabIndex={0} role="button" className="p-2">
                          ...
                        </div>
                        <ul
                          tabIndex={0}
                          className="dropdown-content z-[1] menu shadow bg-base-100 rounded-box"
                        >
                          <li>
                            <Link to={`edit/${quotation.quotation_id}`}>
                              แก้ไข
                            </Link>
                          </li>
                          <li>
                            <button
                              onClick={() => setQuotationfordel(quotation)}
                            >
                              ลบ
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
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
            {Quotation && Quotation.length !== 0 ? (
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
      <ToastContainer Quotation="top-right" />
    </>
  );
}

export default Quotation;
