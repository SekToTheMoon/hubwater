import React, { useState, useEffect } from "react";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import statusOptions from "../constants/statusOptions";
import io from "socket.io-client";
import moment from "moment";
import { handleChangeStatus } from "../utils/changeStatus";
import useAuth from "../hooks/useAuth";
import SearchInput from "./component/SearchInput";
import MobileDocTable from "./component/MobileDocTable";
function ReceiptCash() {
  const axios = useAxiosPrivate();

  const { auth } = useAuth();
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll
  const roll = auth.posit_name === "หัวหน้า" ? "หัวหน้า" : "ลูกน้อง";

  const [ReceiptCash, setReceiptCash] = useState([]);
  const [Banks, setBanks] = useState([]);
  const [ReceiptCashMoney, setReceiptCashMoney] = useState();
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [receiptCashForDel, setReceiptCashfordel] = useState(null);
  // const [indexToUpdate, setIndexToUpdate] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusReceiptCash = statusOptions[4];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchReceiptCashs = async () => {
    let url = `/ReceiptCash?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setReceiptCash(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching ReceiptCashs:", error);
    }
  };

  const fetchBank = async () => {
    const url = `/getbank/all`;
    try {
      const response = await axios.get(url);
      setBanks(response.data);
    } catch (error) {
      console.error("Error fetching bank:", error);
    }
  };

  const handleSelectChange = (event, receiptCash) => {
    const selectedValue = event.target.value;
    handleChangeStatus(selectedValue, receiptCash.rf_id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/receiptCash/delete/" + id);
      setReceiptCashfordel(null);
      fetchReceiptCashs();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hiReceiptCashrogressBar: false,
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
        hiReceiptCashrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchReceiptCashs();
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
      const ReceiptCash_id = ReceiptCashMoney.rf_id;
      await handleReceiptCashMoney();
      setReceiptCashMoney(null);
      await handleChangeStatus("เก็บเงินแล้ว", ReceiptCash_id);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const handleReceiptCashMoney = async () => {
    try {
      console.log("Starting handleReceiptCashMoney");
      const response = await axios.put("/receiptCash/money", ReceiptCashMoney);
      console.log("Completed handleReceiptCashMoney", response.data);
      toast.success(response.data, {
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
      console.error("Error during bill insertion:", error);
      toast.error("Error during receiptCash insertion", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    } finally {
      console.log("handleReceiptCashMoney has finished its try-catch block");
    }
  };

  useEffect(() => {
    fetchReceiptCashs();
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
      //   messageSuccess = false; ทำไมไม่ทำอย่างนี้
      navigate("/ReceiptCash");
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("RF")) {
        setReceiptCash((oldReceiptCashs) => {
          let newReceiptCashs = [...oldReceiptCashs];
          const index = newReceiptCashs.findIndex((q) => q.rf_id === id);
          if (index !== -1) {
            newReceiptCashs[index].rf_status = status;
          }
          return newReceiptCashs;
        });
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    console.log(ReceiptCashMoney);
  }, [ReceiptCashMoney]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบเสร็จรับเงิน(สด)</h1>
          <div className="flex justify-between items-center mb-5">
            <Link to="insert" className="btn btn-primary">
              <i class="fa-solid fa-plus"></i>เพิ่มเอกสาร
            </Link>
            <SearchInput setSearch={setSearch} handleSearch={handleSearch} />
          </div>

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
              {ReceiptCash && ReceiptCash.length !== 0 ? (
                ReceiptCash.map((receiptCash, index) => (
                  <tr className="border-b" key={receiptCash.rf_id}>
                    <td className="pl-4 py-3">
                      {receiptCash.rf_date.substring(0, 10)}
                    </td>
                    <td
                      className="cursor-pointer"
                      onClick={() => navigate(`view/${receiptCash.rf_id}`)}
                    >
                      {receiptCash.rf_id}
                    </td>
                    <td>
                      {receiptCash.customer_fname
                        ? receiptCash.customer_fname
                        : "cash sale / ขายเงินสด"}
                    </td>
                    <td className="text-right">
                      {receiptCash.rf_vat
                        ? Intl.NumberFormat().format(
                            (receiptCash.rf_total * 1.07).toFixed(2)
                          )
                        : Intl.NumberFormat().format(receiptCash.rf_total)}
                    </td>
                    <td>{receiptCash.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={receiptCash.rf_status}
                        className="select select-bordered w-36 max-w-36"
                        onChange={(e) => {
                          if (e.target.value === "เก็บเงิน") {
                            setReceiptCashMoney({
                              ...receiptCash,
                              rf_date: moment(new Date()).format("YYYY-MM-DD"),
                            });
                            fetchBank();
                          } else {
                            handleSelectChange(e, receiptCash);
                          }
                        }}
                      >
                        {statusReceiptCash[receiptCash.rf_status][roll].map(
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
                            <Link to={`edit/${receiptCash.rf_id}`}>แก้ไข</Link>
                          </li>
                          <li>
                            <button
                              onClick={() => setReceiptCashfordel(receiptCash)}
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
            data={ReceiptCash}
            onDelete={setReceiptCashfordel}
            statusList={statusReceiptCash}
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
            {ReceiptCash && ReceiptCash.length !== 0 ? (
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
        {receiptCashForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลใบเสร็จรับเงิน(สด)</h3>
              <p className="py-4">
                ต้องการลบข้อมูลใบเสร็จรับเงิน(สด) {receiptCashForDel}
                หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(receiptCashForDel);
                      setReceiptCashfordel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setReceiptCashfordel(null)}
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
        {ReceiptCashMoney && (
          <dialog open id="my_modal" className="modal">
            <div className="modal-box">
              <h1 className="font-bold text-xl">บันทึกการรับชำระเงิน</h1>
              <div className="grid-cols-2 grid items-center mt-3 gap-y-2">
                <span className="">เลขที่เอกสาร: </span>
                <span className="">{ReceiptCashMoney.rf_id} </span>

                <span className="">ยอดที่ต้องชำระ: </span>
                <span className="">{ReceiptCashMoney.rf_total} </span>

                <span className="">วันที่รับชำระ: </span>
                <input
                  className="border rounded-lg border-base-300 focus:bg-tran "
                  type="date"
                  value={ReceiptCashMoney.rf_date}
                  onChange={(e) =>
                    setReceiptCashMoney({
                      ...ReceiptCashMoney,
                      rf_date: moment(moment(e.target.value)).format(
                        "YYYY-MM-DD"
                      ),
                    })
                  }
                />

                <span className="">ยอดรับสุทธิ: </span>
                <span className="">
                  {ReceiptCashMoney.rf_tax
                    ? parseInt(ReceiptCashMoney.rf_total) -
                      parseInt(ReceiptCashMoney.rf_total) * 0.03
                    : ReceiptCashMoney.rf_total}
                </span>

                <h3 className="font-bold text-lg mt-3">วิธีการรับชำระ</h3>
                <hr />
                <span className="">วิธีการรับชำระ: </span>
                <select
                  className="border rounded-lg border-base-300 focus:outline-none "
                  value={ReceiptCashMoney.rf_pay || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setReceiptCashMoney({ ...ReceiptCashMoney, rf_pay: id });
                  }}
                >
                  <option value="" disabled>
                    เลือกวิธีการชำระ
                  </option>
                  <option value="เงินสด">เงินสด</option>
                  <option value="โอนเงิน">โอนเงิน</option>
                </select>

                {ReceiptCashMoney.rf_pay == "โอนเงิน" ? (
                  <>
                    <span className="">วิธีการรับชำระ: </span>
                    <select
                      className="border rounded-lg border-base-300 focus:outline-none"
                      value={ReceiptCashMoney.bank_id || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setReceiptCashMoney({
                          ...ReceiptCashMoney,
                          bank_id: id,
                        });
                      }}
                    >
                      <option value="" disabled>
                        เลือกวิธีการชำระ
                      </option>
                      {Banks.map((op) => (
                        <option key={op.bank_id} value={op.bank_id}>
                          {op.bank_name +
                            " " +
                            op.bank_type +
                            " " +
                            op.bank_num}
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  ""
                )}
                <h3 className="font-bold text-lg ">รายละเอียด</h3>
                <hr />
                <span className="">หมายเหตุ: </span>
                <textarea
                  className="textarea textarea-bordered"
                  value={ReceiptCashMoney.rf_detail}
                  onChange={(e) => {
                    setReceiptCashMoney({
                      ...ReceiptCashMoney,
                      rf_detail: e.target.value,
                    });
                  }}
                ></textarea>
              </div>

              <div className="modal-action">
                <form method="dialog">
                  {/* if there is a button, it will close the modal */}
                  <button
                    className="btn"
                    onClick={() => {
                      setReceiptCashMoney(null);
                    }}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleSubmit();
                    }}
                  >
                    บันทึก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
      </div>

      <ToastContainer position="top-right" />
    </>
  );
}

export default ReceiptCash;
