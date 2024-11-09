import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import statusOptions from "../constants/statusOptions";
import selectStatusColor from "../utils/selectStatusColor";
import useSocket from "../services/socket";
import { handleChangeStatus } from "../utils/changeStatus";
import DocumentLink from "./component/DocumentLink";
import useAuth from "../hooks/useAuth";
import SearchInput from "./component/SearchInput";
import MobileDocTable from "./component/MobileDocTable";
import { numberFormat } from "../utils/numberFormat";

function Bill() {
  const { auth } = useAuth();
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll
  const roll = auth.posit_name === "หัวหน้า" ? "หัวหน้า" : "ลูกน้อง";

  const axios = useAxiosPrivate();

  const [Bill, setBill] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState(null);
  const [ascDes, setAscDes] = useState(true);
  const [billForDel, setBillfordel] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusBill = statusOptions[1];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchBills = async () => {
    let url = `/Bill?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    if (sort) {
      url += `&sort_by=${sort}&des=${ascDes}`;
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
      navigate(`/invoice/insert?bill=${bill.bn_id}`);
    } else {
      handleChangeStatus(selectedValue, bill.bn_id);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/bill/delete/" + id);
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
      navigate("/Bill");
    }
  }, [currentPage, perPage, sort, ascDes]);

  useSocket(setBill);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบวางบิล</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              <i class="fa-solid fa-plus"></i>เพิ่มเอกสาร
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>
          {billForDel && (
            <dialog open className="modal">
              <div className="modal-box">
                <h3 className="font-bold text-lg">ลบข้อมูลใบวางบิล</h3>
                <p className="py-4">
                  ต้องการลบข้อมูลใบวางบิล {billForDel} หรือไม่
                </p>
                <div className="modal-action">
                  <form method="dialog">
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        handleDelete(billForDel);
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
          <div className="relative hidden shadow-md lg:block">
            <table className="w-full table-auto hidden text-center lg:inline-table">
              <thead className="bg-base-200 ">
                <tr className=" border-b ">
                  <th className="pl-4 py-3">
                    <div class="flex items-center justify-center">
                      วันที่
                      <svg
                        class="w-3 h-3 ms-1.5"
                        onClick={() => {
                          setSort("bn_date");
                          setAscDes(!ascDes);
                        }}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                      </svg>
                    </div>
                  </th>
                  <th>
                    {" "}
                    <div class="flex items-center justify-center">
                      เลขเอกสาร
                      <svg
                        class="w-3 h-3 ms-1.5"
                        onClick={() => {
                          setSort("bn_id");
                          setAscDes(!ascDes);
                        }}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                      </svg>
                    </div>
                  </th>
                  <th>
                    {" "}
                    <div class="flex items-center justify-center">
                      ลูกค้า
                      <svg
                        class="w-3 h-3 ms-1.5"
                        onClick={() => {
                          setSort("customer_fname");
                          setAscDes(!ascDes);
                        }}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                      </svg>
                    </div>
                  </th>
                  <th>
                    {" "}
                    <div class="flex items-center justify-center">
                      ยอดรวมสุทธิ
                      <svg
                        class="w-3 h-3 ms-1.5"
                        onClick={() => {
                          setSort("bn_total");
                          setAscDes(!ascDes);
                        }}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                      </svg>
                    </div>
                  </th>
                  <th>
                    {" "}
                    <div class="flex items-center justify-center">
                      พนักงาน
                      <svg
                        class="w-3 h-3 ms-1.5"
                        onClick={() => {
                          setSort("employee_fname");
                          setAscDes(!ascDes);
                        }}
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                      </svg>
                    </div>
                  </th>
                  <th>สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {Bill && Bill.length !== 0 ? (
                  Bill.map((bill) => (
                    <tr
                      className="border-b border-base-content/30 hover:bg-base-200/50 text-center"
                      key={bill.bn_id}
                    >
                      <td className="pl-4 py-3">
                        {bill.bn_date.substring(0, 10)}
                      </td>
                      <td className="group relative ">
                        <span
                          className="cursor-pointer hover:underline  hover:text-secondary"
                          onClick={() => navigate(`view/${bill.bn_id}`)}
                        >
                          {bill.bn_id}
                        </span>
                        {(bill.qt_id || bill.iv_id) && (
                          <div className="absolute bg-base-100 shadow-md border py-2 px-3 rounded-md inline-block whitespace-nowrap top-0 left-full text-sm  z-10 invisible font-sm group-hover:visible ">
                            <p className="font-bold mb-2 text-secondary">
                              เอกสารที่เกี่ยวข้อง
                            </p>
                            <div className="flex flex-col space-y-2">
                              <DocumentLink
                                to={`/quotation/view/${bill.qt_id}`}
                                id={bill.qt_id}
                              />
                              <DocumentLink
                                to={`/invoice/view/${bill.iv_id}`}
                                id={bill.iv_id}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td>{bill.customer_fname}</td>
                      <td className="text-right pr-2">
                        {bill.bn_vat
                          ? numberFormat(bill.bn_total * 1.07)
                          : numberFormat(bill.bn_total)}
                      </td>
                      <td>{bill.employee_fname}</td>
                      <td className="flex gap-2">
                        <select
                          value={bill.bn_status}
                          className={`select select-bordered w-36 max-w-36 ${selectStatusColor(
                            bill.bn_status
                          )}`}
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
                            <li
                              className={
                                bill.bn_status === "ดำเนินการแล้ว"
                                  ? "disabled"
                                  : ""
                              }
                            >
                              <Link
                                onClick={(e) =>
                                  bill.bn_status === "ดำเนินการแล้ว" &&
                                  e.preventDefault()
                                }
                                to={`edit/${bill.bn_id}`}
                              >
                                แก้ไข
                              </Link>
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
                    <td colSpan="6" className="pt-5 text-center">
                      ไม่มีข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <MobileDocTable
            data={Bill}
            onDelete={setBillfordel}
            statusList={statusBill}
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
