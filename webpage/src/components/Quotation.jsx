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
import SearchInput from "./component/SearchInput";
import MobileDocTable from "./component/MobileDocTable";
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
      navigate(
        `/bill/insert?quotation=${quotation.quotation_id}&version=${quotation.quotation_num}`
      );
    } else if (selectedValue === "สร้างใบแจ้งหนี้") {
      navigate(
        `/invoice/insert?quotation=${quotation.quotation_id}&version=${quotation.quotation_num}`
      );
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
    const socket = io("http://hubwater-production-7ee5.up.railway.app");
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

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบเสนอราคา</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              <i class="fa-solid fa-plus"></i>เพิ่มเอกสาร
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          {quotationForDel && (
            <dialog open className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">ลบข้อมูลใบเสนอราคา</h3>
                <p className="py-4">
                  ต้องการลบข้อมูลใบเสนอราคา {quotationForDel} หรือไม่
                </p>
                <div className="modal-action">
                  <form method="dialog">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleDelete(quotationForDel);
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

          <table className="w-full text-center table-auto hidden lg:inline-table">
            <thead className="bg-base-200 ">
              <tr className=" border-b">
                <th className="pl-4 py-3">วันที่</th>
                <th>เลขเอกสาร</th>
                <th>ลูกค้า</th>
                <th className="text-center">ยอดรวมสุทธิ</th>
                <th>พนักงาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Quotation && Quotation.length !== 0 ? (
                Quotation.map((quotation, index) => (
                  <tr className="border-b" key={quotation.quotation_id + index}>
                    <td className="pl-4 py-3">
                      {quotation.quotation_date.substring(0, 10)}
                    </td>
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
                    <td className="text-right pr-2">
                      {quotation.quotation_vat
                        ? Intl.NumberFormat().format(
                            (quotation.quotation_total * 1.07).toFixed(2)
                          )
                        : Intl.NumberFormat().format(quotation.quotation_total)}
                    </td>
                    <td>{quotation.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={quotation.quotation_status}
                        className="select select-bordered w-36 max-w-36 "
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
                  <td colSpan="6" className="pt-5 text-center">
                    ไม่มีข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <MobileDocTable
            data={Quotation}
            onDelete={setQuotationfordel}
            statusList={statusQuotation}
            handleSelectChange={handleSelectChange}
            roll={roll}
          />
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
