import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import statusOptions from "../constants/statusOptions";
import io from "socket.io-client";
import { handleChangeStatus } from "../utils/changeStatus";
import DocumentLink from "./component/DocumentLink";

function Bill() {
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll
  let roll = localStorage.getItem("posit_name");
  if (roll !== "หัวหน้า") roll = "ลูกน้อง";

  const [Bill, setBill] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [billForDel, setBillfordel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusBill = statusOptions[1];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchBills = async () => {
    let url = `http://localhost:3001/Bill?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setBill(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Bills:", error);
    }
  };

  const handleSelectChange = (event, bill) => {
    const selectedValue = event.target.value;
    if (selectedValue === "สร้างใบแจ้งหนี้") {
      navigate(`/all/invoice/insert?bill=${bill.bn_id}`);
    } else {
      handleChangeStatus(selectedValue, bill.bn_id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete(
        "http://localhost:3001/bill/delete/" + id
      );
      setBillfordel(null);
      fetchBills();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hiBillrogressBar: false,
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
        autoClose: 5000,
        hiBillrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchBills();
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handlePerRowsChange = (newPerPage) => {
    setPerPage(newPerPage);
    setCurrentPage(1); // ตั้งค่าหน้าปัจจุบันเป็น 1 เมื่อเปลี่ยนจำนวนรายการต่อหน้า
  };

  useEffect(() => {
    fetchBills();
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
      navigate("/all/Bill");
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("BN")) {
        setBill((oldBill) => {
          let newBill = [...oldBill];
          const index = newBill.findIndex((q) => q.bn_id === id);
          if (index !== -1) {
            newBill[index].bn_status = status;
          }
          return newBill;
        });
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบวางบิล</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              เพิ่มใบวางบิล
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
          {billForDel && (
            <dialog open className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">ลบข้อมูลใบวางบิล</h3>
                <p className="py-4">
                  ต้องการลบข้อมูลใบวางบิล {billForDel.bn_id} หรือไม่
                </p>
                <div className="modal-action">
                  <form method="dialog">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleDelete(billForDel.bn_id);
                        setBillfordel(null);
                      }}
                    >
                      ยืนยัน
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => setBillfordel(null)}
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
                <th>ลูกค้า</th>
                <th>ยอดรวมสุทธิ</th>
                <th>พนักงาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Bill && Bill.length !== 0 ? (
                Bill.map((bill, index) => (
                  <tr key={bill.bn_id}>
                    <td>{bill.bn_date.substring(0, 10)}</td>
                    <td className="group relative ">
                      <span
                        className="cursor-pointer hover:underline "
                        onClick={() => navigate(`view/${bill.bn_id}`)}
                      >
                        {bill.bn_id}
                      </span>
                      {(bill.quotation_id || bill.iv_id) && (
                        <div className="absolute bg-white  border py-2 px-3 rounded-md inline-block whitespace-nowrap top-0 left-full text-sm  z-10 invisible font-sm group-hover:visible ">
                          <p className="font-bold mb-2">เอกสารที่เกี่ยวข้อง</p>
                          <div className="flex flex-col space-y-2">
                            <DocumentLink
                              to={`/all/quotation/view/${bill.quotation_id}`}
                              id={bill.quotation_id}
                            />
                            <DocumentLink
                              to={`/all/invoice/view/${bill.iv_id}`}
                              id={bill.iv_id}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{bill.customer_fname}</td>
                    <td>{bill.bn_total}</td>
                    <td>{bill.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={bill.bn_status}
                        className="select select-bordered w-1/2 max-w-xs"
                        onChange={(e) => handleSelectChange(e, bill)}
                      >
                        {statusBill[bill.bn_status][roll].map(
                          (element, idx) => (
                            <option key={idx} value={element}>
                              {element}
                            </option>
                          )
                        )}
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
                            <Link to={`edit/${bill.bn_id}`}>แก้ไข</Link>
                          </li>
                          <li>
                            <button onClick={() => setBillfordel(bill)}>
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
            {Bill && Bill.length !== 0 ? (
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

export default Bill;
