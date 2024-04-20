import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function Bank() {
  const [Bank, setBank] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const totalPages = Math.ceil(totalRows / perPage);
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;
  const fetchBanks = async () => {
    let url = `http://localhost:3001/Bank?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setBank(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Banks:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        "http://localhost:3001/Bank/delete/" + id
      );
      fetchBanks();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
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
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchBanks();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchBanks();
    if (messageSuccess) {
      toast.success(messageSuccess, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      navigate("/all/Bank");
    }
  }, [currentPage, perPage]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">บัญชีธนาคาร</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มบัญชีธนาคาร
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
          <table className="table text-base">
            <thead>
              <tr className=" text-base">
                <th>รหัส</th>
                <th>เลขบัญชีธนาคาร</th>
                <th>ธนาคาร</th>
                <th>ชื่อเจ้าของบัญชี</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Bank && Bank.length !== 0 ? (
                Bank.map((brd) => (
                  <tr key={brd.bank_id}>
                    <td>{brd.bank_id}</td>
                    <td>{brd.bank_num}</td>
                    <td>{brd.bank_name}</td>
                    <td>{brd.bank_owner}</td>
                    <td>
                      <Link
                        to={`edit/${brd.bank_id}`}
                        className="btn btn-primary mr-3"
                      >
                        แก้ไข
                      </Link>
                      <button
                        className="btn btn-error"
                        onClick={() =>
                          document
                            .getElementById("my_modal_" + brd.bank_id)
                            .showModal()
                        }
                      >
                        ลบ
                      </button>
                      <dialog
                        id={`my_modal_${brd.bank_id}`}
                        className="modal"
                        key={`modal_${brd.bank_id}`}
                      >
                        <div className="modal-box">
                          <h3 className="font-bold text-lg">
                            ลบข้อมูลบัญชีธนาคาร
                          </h3>
                          <p className="py-4">
                            ต้องการลบข้อมูลบัญชีธนาคาร {brd.bank_name} หรือไม่
                          </p>
                          <div className="modal-action">
                            <form method="dialog">
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDelete(brd.bank_id)}
                              >
                                ยืนยัน
                              </button>
                              <button className="btn btn-error">ยกเลิก</button>
                            </form>
                          </div>
                        </div>
                      </dialog>
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
            {Bank && Bank.length !== 0 ? (
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
      <ToastContainer position="top-right" />
    </>
  );
}

export default Bank;
