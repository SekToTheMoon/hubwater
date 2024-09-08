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
import DocumentLink from "./component/DocumentLink";
import useAuth from "../hooks/useAuth";
function Receipt() {
  const axios = useAxiosPrivate();
  const { auth } = useAuth();
  //ดึงตำแหน่งมาเพื่อมาเซ็ต option ใน roll
  const roll = auth.posit_name === "หัวหน้า" ? "หัวหน้า" : "ลูกน้อง";

  const [Receipt, setReceipt] = useState([]);
  const [Banks, setBanks] = useState([]);
  const [ReceiptMoney, setReceiptMoney] = useState();
  const [totalRows, setTotalRows] = useState(0);
  const [perPage, setPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [receiptForDel, setReceiptfordel] = useState(null);
  // const [indexToUpdate, setIndexToUpdate] = useState(null);
  const totalPages = Math.ceil(totalRows / perPage);
  const statusReceipt = statusOptions[3];
  const location = useLocation();
  const { state } = location;
  const navigate = useNavigate();
  let messageSuccess = state && state.msg;

  const fetchReceipts = async () => {
    let url = `/Receipt?page=${currentPage}&per_page=${perPage}`;
    if (search != "") {
      url += `&search=${search}`;
    }
    try {
      const response = await axios.get(url);
      setReceipt(response.data.data);
      setTotalRows(response.data.total);
    } catch (error) {
      console.error("Error fetching Receipts:", error);
    }
  };

  const fetchBank = async () => {
    let url = `/getbank/all`;
    try {
      const response = await axios.get(url);
      setBanks(response.data);
    } catch (error) {
      console.error("Error fetching bank:", error);
    }
  };

  const handleSelectChange = (event, receipt) => {
    const selectedValue = event.target.value;
    handleChangeStatus(selectedValue, receipt.rc_id);
  };

  const handleDelete = async (id) => {
    try {
      const response = await axios.delete("/receipt/delete/" + id);
      setReceiptfordel(null);
      fetchReceipts();
      if (response.data && response.data.msg) {
        toast.info(response.data.msg, {
          position: "top-right",
          autoClose: 3000,
          hiReceiptrogressBar: false,
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
        hiReceiptrogressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
      });
    }
  };

  const handleSearch = () => {
    fetchReceipts();
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
      const Receipt_id = ReceiptMoney.rc_id;
      await handleReceiptMoney();
      setReceiptMoney(null);
      await handleChangeStatus("เก็บเงินแล้ว", Receipt_id);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
    }
  };

  const handleReceiptMoney = async () => {
    try {
      const response = await axios.put("/receipt/money", ReceiptMoney);
      console.log("Completed handleReceiptMoney", response.data);
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
      toast.error("Error during receipt insertion", {
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
      console.log("handleReceiptMoney has finished its try-catch block");
    }
  };

  useEffect(() => {
    fetchReceipts();
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
      navigate("/Receipt");
    }
  }, [currentPage, perPage]);

  useEffect(() => {
    const socket = io("http://localhost:3001");
    socket.on("statusUpdate", ({ status, id }) => {
      if (id.startsWith("RC")) {
        setReceipt((oldReceipts) => {
          let newReceipts = [...oldReceipts];
          const index = newReceipts.findIndex((q) => q.rc_id === id);
          if (index !== -1) {
            newReceipts[index].rc_status = status;
          }
          return newReceipts;
        });
      }
    });

    return () => {
      console.log("Cleaning up socket");
      socket.disconnect();
    };
  }, []);
  useEffect(() => {
    console.log(ReceiptMoney);
  }, [ReceiptMoney]);

  return (
    <>
      <div className="overflow-x-auto">
        <div className="rounded-box bg-base-100 p-5 ">
          <h1 className="text-2xl mb-5">ใบเสร็จรับเงิน</h1>
          <div className="items-center mb-5">
            <div className="flex justify-end">
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
                <th>วันที่</th>
                <th>เลขเอกสาร</th>
                <th>ลูกค้า</th>
                <th>ยอดรวมสุทธิ</th>
                <th>พนักงาน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {Receipt && Receipt.length !== 0 ? (
                Receipt.map((receipt, index) => (
                  <tr key={receipt.rc_id}>
                    <td>{receipt.rc_date.substring(0, 10)}</td>
                    <td className="group relative ">
                      <span
                        className="cursor-pointer hover:underline "
                        onClick={() =>
                          navigate(`view?receipt=${receipt.rc_id}`)
                        }
                      >
                        {receipt.rc_id}
                      </span>
                      {receipt.iv_id && (
                        <div className="absolute bg-white  border py-2 px-3 rounded-md inline-block whitespace-nowrap top-0 left-full text-sm  z-10 invisible font-sm group-hover:visible ">
                          <p className="font-bold mb-2">เอกสารที่เกี่ยวข้อง</p>
                          <div className="flex flex-col space-y-2">
                            <DocumentLink
                              to={`/invoice/view/${receipt.iv_id}`}
                              id={receipt.iv_id}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                    <td>{receipt.customer_fname}</td>
                    <td>
                      {receipt.rc_vat
                        ? receipt.rc_total * 1.07
                        : receipt.rc_total}
                    </td>
                    <td>{receipt.employee_fname}</td>
                    <td className="flex gap-2">
                      <select
                        value={receipt.rc_status}
                        className="select select-bordered w-1/2 max-w-xs"
                        onChange={(e) => {
                          if (e.target.value === "เก็บเงิน") {
                            setReceiptMoney({
                              ...receipt,
                              rc_payday: moment(new Date()).format(
                                "YYYY-MM-DD"
                              ),
                            });
                            fetchBank();
                          } else {
                            handleSelectChange(e, receipt);
                          }
                        }}
                      >
                        {statusReceipt[receipt.rc_status][roll].map(
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
                            <button onClick={() => setReceiptfordel(receipt)}>
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
            {Receipt && Receipt.length !== 0 ? (
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
        {receiptForDel && (
          <dialog open className="modal">
            <div className="modal-box">
              <h3 className="font-bold text-lg">ลบข้อมูลใบเสร็จรับเงิน</h3>
              <p className="py-4">
                ต้องการลบข้อมูลใบเสร็จรับเงิน {receiptForDel.rc_id} หรือไม่
              </p>
              <div className="modal-action">
                <form method="dialog">
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleDelete(receiptForDel.rc_id);
                      setReceiptfordel(null);
                    }}
                  >
                    ยืนยัน
                  </button>
                  <button
                    className="btn btn-error"
                    onClick={() => setReceiptfordel(null)}
                  >
                    ยกเลิก
                  </button>
                </form>
              </div>
            </div>
          </dialog>
        )}
        {ReceiptMoney && (
          <dialog open id="my_modal" className="modal">
            <div className="modal-box">
              <h1 className="font-bold text-xl">บันทึกการรับชำระเงิน</h1>
              <div className="grid-cols-2 grid items-center mt-3 gap-y-2">
                <span className="">เลขที่เอกสาร: </span>
                <span className="">{ReceiptMoney.rc_id} </span>

                <span className="">ยอดที่ต้องชำระ: </span>
                <span className="">{ReceiptMoney.rc_total} </span>

                <span className="">วันที่รับชำระ: </span>
                <input
                  className="border rounded-lg border-base-300 focus:bg-tran "
                  type="date"
                  value={ReceiptMoney.rc_payday}
                  onChange={(e) =>
                    setReceiptMoney({
                      ...ReceiptMoney,
                      rc_payday: moment(moment(e.target.value)).format(
                        "YYYY-MM-DD"
                      ),
                    })
                  }
                />

                <span className="">ยอดรับสุทธิ: </span>
                <span className="">
                  {ReceiptMoney.rc_tax
                    ? parseInt(ReceiptMoney.rc_total) -
                      parseInt(ReceiptMoney.rc_total) * 0.03
                    : ReceiptMoney.rc_total}
                </span>

                <h3 className="font-bold text-lg mt-3">วิธีการรับชำระ</h3>
                <hr />
                <span className="">วิธีการรับชำระ: </span>
                <select
                  className="border rounded-lg border-base-300 focus:outline-none "
                  value={ReceiptMoney.rc_pay || ""}
                  onChange={(e) => {
                    const id = e.target.value;
                    setReceiptMoney({ ...ReceiptMoney, rc_pay: id });
                  }}
                >
                  <option value="" disabled>
                    เลือกวิธีการชำระ
                  </option>
                  <option value="เงินสด">เงินสด</option>
                  <option value="โอนเงิน">โอนเงิน</option>
                </select>

                {ReceiptMoney.rc_pay == "โอนเงิน" ? (
                  <>
                    <span className="">วิธีการรับชำระ: </span>
                    <select
                      className="border rounded-lg border-base-300 focus:outline-none"
                      value={ReceiptMoney.bank_id || ""}
                      onChange={(e) => {
                        const id = e.target.value;
                        setReceiptMoney({ ...ReceiptMoney, bank_id: id });
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
                  value={ReceiptMoney.rc_detail}
                  onChange={(e) => {
                    setReceiptMoney({
                      ...ReceiptMoney,
                      rc_detail: e.target.value,
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
                      setReceiptMoney(null);
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

export default Receipt;
