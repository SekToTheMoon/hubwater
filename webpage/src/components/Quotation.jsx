import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import statusOptions from "../constants/statusOptions";
import { handleChangeStatus } from "../utils/changeStatus";
import io from "socket.io-client";
import DocumentLink from "./component/DocumentLink";
import useAuth from "../hooks/useAuth";
function Quotation() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll

  const roll = auth.posit_name === "หัวหน้า" ? "หัวหน้า" : "ลูกน้อง";

  const [Quotation, setQuotation] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [quotationForDel, setQuotationfordel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusQuotation = statusOptions[0];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchQuotations = async () => {
    let url = `/Quotation?page=${currentPage}&per_page=${perPage}`;
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

  const handleSelectChange = (event, quotation) => {
    const selectedValue = event.target.value;
    if (selectedValue === "สร้างใบวางบิล") {
      navigate(`/bill/insert?quotation=${quotation.quotation_id}`);
    } else if (selectedValue === "สร้างใบแจ้งหนี้") {
      navigate(`/invoice/insert?quotation=${quotation.quotation_id}`);
    } else {
      handleChangeStatus(selectedValue, quotation.quotation_id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/quotation/delete/" + id);
      setQuotationfordel(null);
      fetchQuotations();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
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
        position: "top-right",
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
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
      navigate("/Quotation");
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("QT")) {
        setQuotation((oldQuotations) => {
          let newQuotations = [...oldQuotations];
          const index = newQuotations.findIndex((q) => q.quotation_id === id);
          if (index !== -1) {
            newQuotations[index].quotation_status = status;
          }
          return newQuotations;
        });
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);
  const [hovered, setHovered] = useState(false);
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
                <th>ลูกค้า</th>
                <th>ยอดรวมสุทธิ</th>
                <th>พนักงาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Quotation && Quotation.length !== 0 ? (
                Quotation.map((quotation, index) => (
                  <tr key={quotation.quotation_id}>
                    <td>{quotation.quotation_date.substring(0, 10)}</td>
                    <td className="group relative ">
                      <span
                        className="cursor-pointer hover:underline "
                        onClick={() =>
                          navigate(
                            `view/${quotation.quotation_id}?version=${quotation.quotation_num}`
                          )
                        }
                      >
                        {quotation.quotation_id}{" "}
                      </span>
                      {(quotation.bn_id || quotation.iv_id) && (
                        <div className="absolute bg-white  border py-2 px-3 rounded-md inline-block whitespace-nowrap top-0 left-full text-sm  z-10 invisible font-sm group-hover:visible ">
                          <p className="font-bold mb-2">เอกสารที่เกี่ยวข้อง</p>
                          <div className="flex flex-col space-y-2">
                            <DocumentLink
                              to={`/bill/view/${quotation.bn_id}`}
                              id={quotation.bn_id}
                            />
                            <DocumentLink
                              to={`/invoice/view/${quotation.iv_id}`}
                              id={quotation.iv_id}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{quotation.customer_fname}</td>
                    <td>{quotation.quotation_total}</td>
                    <td>{quotation.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={quotation.quotation_status}
                        className="select select-bordered w-1/2 max-w-xs"
                        onChange={(e) => handleSelectChange(e, quotation)}
                      >
                        {statusQuotation[quotation.quotation_status][roll].map(
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
                          <li
                            className={
                              quotation.quotation_status === "ดำเนินการแล้ว"
                                ? "disabled"
                                : ""
                            }
                          >
                            <Link
                              onClick={(e) =>
                                quotation.quotation_status ===
                                  "ดำเนินการแล้ว" && e.preventDefault()
                              }
                              to={`edit/${quotation.quotation_id}?version=${quotation.quotation_num}`}
                            >
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
      <ToastContainer position="top-right" />
    </>
  );
}

export default Quotation;
